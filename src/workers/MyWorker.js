// MyWorker.js

// @args: You can pass your worker parameters on initialisation
export default function MyWorker(args) {
	postMessage('Response');
	let onmessage = (event) => {
		// eslint-disable-line no-unused-vars
		if (typeof event.data === 'string') {
			const { endpoint, options } = JSON.parse(event.data) || {};
			console.log('event.data', event.data);

			endpoint &&
				fetch(endpoint, options)
					.then((response) => response.json())
					.then((data) => {
						postMessage({ type: 'apiResponse', data });
					});
		}
	};
}
