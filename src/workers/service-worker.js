'use srict';

const SWVERSION = 10;
const CURRENT_CACHES = {
	prefetch: 'prefetch-cache-v' + SWVERSION,
};

const urlsToPrefetch = [
	'/',
	'/static/images/Dubai-Al-Arab.webp',
	'/static/images/mario.png',
	'/js/app.js',
	'/js/states.json',
	'/manifest.json',
	'https://api.github.com/users/aasifrasul',
	'/web-Worker.js',
];

const routes = [
	{
		url: '/',
		template: '/src/templates/home.html',
		script: '/src/templates/home.js.html',
	},
];

importScripts('./getApi.js');

const fetchCacheByKey = (name) => ({
	cache: {
		name,
		maxAgeSeconds: null,
		maxEntries: null,
	},
});

const openCache = (options) => {
	let cacheName;
	const {
		cache: { name },
	} = options || {};
	cacheName = name || null;
	return caches.open(cacheName);
};

const createCacheBustedRequest = (url) => {
	const request = new Request(url, {
		cache: 'reload',
	});
	if ('cache' in request) {
		return request;
	}

	const bustedUrl = new URL(url, self.location.href);
	bustedUrl.search += (bustedUrl.search ? '&' : '') + 'cachebust=' + Date.now();
	return new Request(bustedUrl);
};

const handleError = (err) => {
	console.log(err);
	throw err;
};

const fetchSWVersionFromCache = () => caches.open('SWVERSION');

const saveCurrentVersionInCache = (req, resp) =>
	fetchSWVersionFromCache().then((cache) => cache.put(req.url, resp).catch(handleError));

const fetchCachedVersion = (req) =>
	fetchSWVersionFromCache()
		.then((cache) => {
			return cache
				.match(req)
				.then((response) => {
					if (response) {
						return response
							.json()
							.then((cacheversion) => cacheversion)
							.catch(handleError);
					} else {
						return Promise.resolve();
					}
				})
				.catch(handleError);
		})
		.catch(handleError);

const notifyClients = (response) =>
	self.clients
		.matchAll()
		.then((clients) => {
			const promises = clients.map((client) =>
				client.postMessage(JSON.stringify(response))
			);
			return Promise.all(promises);
		})
		.catch(handleError);

const checkVersion = () => {
	const req = new Request('https://foo.bar/swversion');
	return fetchCachedVersion(req.clone())
		.then((cacheversion) => {
			const obj = {};
			obj['newVersion'] = SWVERSION;
			obj['oldVersion'] = cacheversion || null;
			if (cacheversion !== SWVERSION) {
				const resp = new Response(SWVERSION);
				saveCurrentVersionInCache(req, resp).catch(handleError);
			}
			return notifyClients({
				type: 'VERSION_TRACKING',
				data: obj,
			});
		})
		.catch(handleError);
};

self.addEventListener('install', (e) => {
	e.waitUntil(self.skipWaiting());

	e.waitUntil(
		caches
			.open(CURRENT_CACHES.prefetch)
			.then((cache) => {
				const cachePromises = urlsToPrefetch.map((urlToPrefetch) => {
					const url = new URL(urlToPrefetch, self.location.href);
					url.search += (url.search ? '&' : '?') + 'cache-bust=' + Date.now();

					const request = new Request(url, {
						mode: 'no-cors',
						cache: 'no-cache',
					});
					return fetch(request)
						.then((response) => {
							const { status, statusText } = response || {};
							if (status >= 400) {
								throw new Error(
									`request for ${urlToPrefetch} failed with status ${statusText}`
								);
							}

							return cache.put(urlToPrefetch, response);
						})
						.catch((error) => {
							console.error(`Not caching ${urlToPrefetch} due to ${error}`);
						});
				});

				return Promise.all(cachePromises).then(() =>
					console.log('Pre-fetching complete.')
				);
			})
			.catch((error) => console.error('Pre-fetching failed:', error))
	);
});

self.addEventListener('activate', (e) => {
	notifyClients('Hello From SW');

	const expectedCacheNames = Object.values(CURRENT_CACHES);

	e.waitUntil(
		caches.keys().then((cacheNames) => {
			const promises = cacheNames.map((cacheName) => {
				if (
					expectedCacheNames.indexOf(cacheName) === -1 &&
					cacheName !== 'SWVERSION'
				) {
					console.log('Deleting out of date cache:', cacheName);
					return caches.delete(cacheName);
				} else {
					return Promise.resolve();
				}
			});
			return Promise.all(promises);
		})
	);
	e.waitUntil(self.clients.claim().then(() => checkVersion()));
});

self.addEventListener('fetch', (e) => {
	const { request } = e;
	const { method, url } = request || {};

	fetchHandler(e);

	// Skip cross-origin requests, like those for Google Analytics.
	// if (e.request.url.startsWith(self.location.origin)) {

	if (!url.startsWith(self.location.origin) && method !== 'GET') {
		console.log('WORKER: fetch event ignored.', method, url);
		return;
	}
	e.respondWith(
		caches.match(request.clone()).then((response) => {
			if (response) {
				return response;
			}
			return fetch(request)
				.then((response) => {
					const clonedResponse = response.clone();
					caches.open(CURRENT_CACHES.prefetch).then((cache) => {
						cache.put(request.url, clonedResponse);
					});
					return response;
				})
				.catch(handleError);
		})
	);
});

const fetchHandler = async (e) => {
	const { request } = e;
	const { url, method } = request;
	const { pathname } = new URL(url);
	const routeMatch = routes.find(({ url }) => url === pathname);

	if (routeMatch) {
		e.respondWith(getStreamedHtmlResponse(url, routeMatch));
	} else {
		e.respondWith(
			caches.match(request).then((response) => (response ? response : fetch(request)))
		);
	}
};

const getStreamedHtmlResponse = (url, routeMatch) => {
	const stream = new ReadableStream({
		async start(controller) {
			const pushToStream = (stream) => {
				const reader = stream.getReader();

				return reader.read().then(function process(result) {
					if (result.done) {
						return;
					}
					controller.enqueue(result.value);
					return reader.read().then(process);
				});
			};

			const [header, footer, content, script] = await Promise.all([
				caches.match('/src/templates/header.html'),
				caches.match('/src/templates/footer.html'),
				caches.match(routeMatch.template),
				caches.match(routeMatch.script),
			]);

			await pushToStream(header.body);
			await pushToStream(content.body);
			await pushToStream(footer.body);
			await pushToStream(script.body);

			controller.close();
		},
	});
	// here we return the response whose body is the stream
	return new Response(stream, {
		headers: { 'Content-Type': 'text/html; charset=utf-8' },
	});
};

/*
	// This sample illustrates an aggressive approach to caching, in which every valid response is
	// cached and every request is first checked against the cache.
	// This may not be an appropriate approach if your web application makes requests for
	// arbitrary URLs as part of its normal operation (e.g. a RSS client or a news aggregator),
	// as the cache could end up containing large responses that might not end up ever being accessed.
	// Other approaches, like selectively caching based on response headers or only caching
	// responses served from a specific domain, might be more appropriate for those use cases.
	self.addEventListener('fetch', function(event) {
		console.log('Handling fetch event for', event.request.url);

		event.respondWith(
			caches.open(CURRENT_CACHES['prefetch']).then(function(cache) {
				return cache.match(event.request).then(function(response) {
					if (response) {
						// If there is an entry in the cache for event.request, then response will be defined
						// and we can just return it.
						console.log(' Found response in cache:', response);

						return response;
					}

					// Otherwise, if there is no entry in the cache for event.request, response will be
					// undefined, and we need to fetch() the resource.
					console.log(' No response for %s found in cache. ' +
						'About to fetch from network...', event.request.url);

					// We call .clone() on the request since we might use it in the call to cache.put() later on.
					// Both fetch() and cache.put() "consume" the request, so we need to make a copy.
					// (see https://fetch.spec.whatwg.org/#dom-request-clone)
					return fetch(event.request.clone()).then(function(response) {
						console.log('  Response for %s from network is: %O',
							event.request.url, response);

						// Optional: add in extra conditions here, e.g. response.type == 'basic' to only cache
						// responses from the same domain. See https://fetch.spec.whatwg.org/#concept-response-type
						if (response.status < 400) {
							// This avoids caching responses that we know are errors (i.e. HTTP status code of 4xx or 5xx).
							// One limitation is that, for non-CORS requests, we get back a filtered opaque response
							// (https://fetch.spec.whatwg.org/#concept-filtered-response-opaque) which will always have a
							// .status of 0, regardless of whether the underlying HTTP call was successful. Since we're
							// blindly caching those opaque responses, we run the risk of caching a transient error response.
							//
							// We need to call .clone() on the response object to save a copy of it to the cache.
							// (https://fetch.spec.whatwg.org/#dom-request-clone)
							cache.put(event.request, response.clone());
						}

						// Return the original response object, which will be used to fulfill the resource request.
						return response;
					});
				}).catch(function(error) {
					// This catch() will handle exceptions that arise from the match() or fetch() operations.
					// Note that a HTTP error response (e.g. 404) will NOT trigger an exception.
					// It will return a normal response object that has the appropriate error code set.
					console.error('  prefetch caching failed:', error);

					throw error;
				});
			})
		);
	});
*/

self.addEventListener('push', (e) => {
	console.log('Received a push message', e);

	const title = 'Yay a message.';
	const body = 'We have received a push message.';
	const icon = '/images/icon-192x192.png';
	const tag = 'simple-push-demo-notification-tag';

	e.waitUntil(
		self.registration.showNotification(title, {
			body,
			icon,
			tag,
		})
	);
});

self.addEventListener('notificationclick', (e) => {
	console.log('On notification click: ', e.notification.tag);
	// Android doesn’t close the notification when you click on it
	// See: http://crbug.com/463146
	e.notification.close();

	// This looks to see if the current is already open and
	// focuses if it is
	e.waitUntil(
		clients
			.matchAll({
				type: 'window',
			})
			.then((clientList) => {
				for (let i = 0; i < clientList.length; i++) {
					const client = clientList[i];
					if (client.url === '/' && 'focus' in client) {
						return client.focus();
					}
				}
				if (clients.openWindow) {
					//return clients.openWindow('/');
					return clients.openWindow(e.notification.data.url);
				}
			})
	);
});

self.addEventListener('install', (event) => {
	event.registerForeignFetch({
		scopes: ['/random'], // or self.registration.scope to handle everything
		origins: ['*'], // or ['https://example.com'] to limit the remote origins
	});
});

self.addEventListener('foreignFetch', (event) => {
	event.respondWith(
		fetch(event.request) // Try to make a network request
			.catch(() => new Response('34')) // Offline? Your random number is 34!
			.then((response) => {
				console.log('response', response);
				return {
					response,
					origin: event.origin, // Make this a CORS response
				};
			})
	);
});

self.addEventListener('message', ({ data, ports }) => {
	console.log(`Received a message from main thread: ${data}`);
	checkVersion();
	console.log(ports);
	Array.isArray(ports) && ports[0] && ports[0].postMessage(`Roger that! - "${data}"`);
});

self.addEventListener('sync', (e) => console.log(e));
