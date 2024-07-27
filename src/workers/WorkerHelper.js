const workerPath = new URL('./MyWorker', import.meta.url);
const worker = new Worker(workerPath, { type: 'module' });

worker.addEventListener('error', (error) => {
	console.error('Error in worker:', error);
});

worker.addEventListener('exit', (exitCode) => {
	console.log('Worker exited with code:', exitCode);
});

export function fetchAPIData(endpoint, options) {
	worker.postMessage({ type: 'fetchAPIData', data: { endpoint, options } });

	return new Promise((resolve, reject) => {
		worker.addEventListener('message', (event) => {
			event.preventDefault();
			const { type, data } = event.data;
			type === 'fetchAPIDataResponse' ? resolve(data) : reject(data);
		});
	});
}

export function loadImages(imageUrls = []) {
	worker.postMessage({ type: 'loadImages', data: imageUrls });

	return new Promise((resolve, reject) => {
		worker.addEventListener('message', (event) => {
			event.preventDefault();
			const { type, data } = event.data;
			type === 'loadImagesResponse' ? resolve(data) : reject(data);
		});
	});
}

export function abortFetchRequest(endPoint) {
	worker.postMessage({ type: 'abortFetchRequest', data: endPoint });
}
