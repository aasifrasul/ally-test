const workerPath = new URL('../../workers/MyWorker', import.meta.url);
const worker = new Worker(workerPath);

function useWebWorker() {
	function fetchAPIData(endpoint, options) {
		worker.postMessage({ type: 'fetchAPIData', data: { endpoint, options } });

		return new Promise((resolve, reject) => {
			worker.onmessage = (event) => {
				event.preventDefault();
				const { type, data } = event.data;

				if (type === 'fetchAPIDataResponse') {
					resolve(data);
				} else {
					reject(data);
				}
			};
		});
	}

	function loadImages(imageUrls = []) {
		worker.postMessage({ type: 'loadImages', data: imageUrls });

		return new Promise((resolve, reject) => {
			worker.onmessage = (event) => {
				event.preventDefault();
				const { type, data } = event.data;

				if (type === 'loadImagesResponse') {
					resolve(data);
				} else {
					reject(data);
				}
			};
		});
	}

	function abortFetchRequest(endPoint) {
		worker.postMessage({ type: 'abortFetchRequest', data: endPoint });
	}

	return {
		fetchAPIData,
		loadImages,
		abortFetchRequest,
	};
}

export default useWebWorker;
