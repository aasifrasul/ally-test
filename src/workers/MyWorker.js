// MyWorker.js

const blob = new Blob(
	[
		`
self.addEventListener('message', (event) => {
	if (typeof event.data === 'string') {
		const { endpoint, options } = JSON.parse(event.data) || {};

		endpoint &&
			fetch(endpoint, options)
				.then((response) => {
					if (response.status == 200) {
						return response.json();
					} else {
						throw new Error(response);
					}
				})
				.then((data) => {
					postMessage({ type: 'apiResponse', data });
				});
	}
}, false);
	`,
	],
	{ type: 'text/javascript' },
);

// Obtain a blob URL reference to our worker 'file'.
const blobURL = window.URL.createObjectURL(blob);
export default new Worker(blobURL);
