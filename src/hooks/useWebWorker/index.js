const workerPath = new URL('../../workers/MyWorker', import.meta.url);
const worker = new Worker(workerPath);

function useWebWorker() {
	function fetchAPIData(endpoint, options) {
		worker.postMessage(
			JSON.stringify({ type: 'fetchAPIData', data: { endpoint, options } })
		);

		return new Promise((resolve, reject) => {
			worker.onmessage = function (event) {
				const { type, data } = event.data;

				if (type === 'fetchAPIDataResponse') {
					resolve(data);
				} else {
					reject(new Error('There was some error.'));
				}
			};
		});
	}

	function loadImages(imageUrls = []) {
		worker.postMessage(JSON.stringify({ type: 'loadImages', data: imageUrls }));

		return new Promise((resolve, reject) => {
			worker.onmessage = function (event) {
				const { type, data } = event.data;

				if (type === 'loadImagesResponse') {
					resolve(data);
				} else {
					reject(new Error('There was some error.'));
				}
			};
		});
	}

	return {
		fetchAPIData,
		loadImages,
	};
}

export default useWebWorker;
