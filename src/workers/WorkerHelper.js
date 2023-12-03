class WorkerHelper {
	constructor() {
		const workerPath = new URL('./MyWorker', import.meta.url);
		const worker = new Worker(workerPath, { type: 'module' });

		worker.addEventListener('error', (error) => {
			console.error('Error in worker:', error);
		});

		worker.addEventListener('exit', (exitCode) => {
			console.log('Worker exited with code:', exitCode);
		});

		this.worker = worker;
	}

	fetchAPIData(endpoint, options) {
		this.worker.postMessage({ type: 'fetchAPIData', data: { endpoint, options } });

		return new Promise((resolve, reject) => {
			this.worker.addEventListener('message', (event) => {
				event.preventDefault();
				const { type, data } = event.data;
				type === 'fetchAPIDataResponse' ? resolve(data) : reject(data);
			});
		});
	}

	loadImages(imageUrls = []) {
		this.worker.postMessage({ type: 'loadImages', data: imageUrls });

		return new Promise((resolve, reject) => {
			this.worker.addEventListener('message', (event) => {
				event.preventDefault();
				const { type, data } = event.data;
				type === 'loadImagesResponse' ? resolve(data) : reject(data);
			});
		});
	}

	abortFetchRequest(endPoint) {
		this.worker.postMessage({ type: 'abortFetchRequest', data: endPoint });
	}
}

export default WorkerHelper;
