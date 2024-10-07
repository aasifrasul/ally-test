const hashMapEndPoints = new Map();
const hashMapData = new Map();

async function handleLoadImages(id, imageUrls) {
	try {
		const promises = imageUrls.map(async (url) => {
			const req = new Request(url);
			const response = await fetch(req);
			const fileBlob = response.blob();
			if (fileBlob.type === 'image/jpeg') {
				return URL.createObjectURL(fileBlob);
			}
		});

		const loadedImages = await Promise.all(promises);
		self.postMessage({ id, type: 'loadImagesResponse', data: loadedImages });
	} catch (error) {
		self.postMessage({ id, type: 'loadImagesError', error: error.message });
	}
}

async function handleFetchAPIData(id, { endpoint, options = {} }) {
	try {
		const abortController = new AbortController();
		const isGetRequest = options.method?.toUpperCase() === 'GET';

		if (isGetRequest && hashMapData.has(endpoint)) {
			postMessage({ type: `${type}Response`, data: hashMapData.get(endpoint) });
			return;
		}

		hashMapEndPoints.set(endpoint, () => abortController.abort());

		const enhancedOptions = {
			...options,
			signal: abortController.signal,
		};

		const req = new Request(endpoint, enhancedOptions);

		const response = await fetch(req);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		self.postMessage({ id, type: 'fetchAPIDataResponse', data });
	} catch (error) {
		if (error.name === 'AbortError') {
			self.postMessage({
				id,
				type: 'fetchAPIDataAborted',
				error: 'Request was aborted',
			});
		} else {
			self.postMessage({ id, type: 'fetchAPIDataError', error: error.message });
		}
	}
}

function handleAbortFetchRequest(id, endpoint) {
	const abortCallback = hashMapEndPoints.get(endpoint);
	if (typeof abortCallback === 'function') {
		abortCallback();
		hashMapEndPoints.delete(endpoint);
		self.postMessage({ id, type: 'abortFetchRequestResponse', data: 'Request aborted' });
	} else {
		self.postMessage({
			id,
			type: 'abortFetchRequestError',
			error: 'No active request found',
		});
	}
}

self.onmessage = async (event) => {
	const { id, type, data } = event.data;
	if (typeof id !== 'number' || typeof type !== 'string') {
		throw new Error('Invalid message format');
	}

	switch (type) {
		case 'fetchAPIData':
			await handleFetchAPIData(id, data);
			break;
		case 'loadImages':
			await handleLoadImages(id, data);
			break;
		case 'abortFetchRequest':
			handleAbortFetchRequest(id, data);
			break;
		default:
			self.postMessage({ id, type: 'error', error: 'Unknown message type' });
	}
};
