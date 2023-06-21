import worker from '../workers/MyWorker';

function useWebWorker() {
	function fetchAPIData(endpoint, options) {
		worker.postMessage(JSON.stringify({ endpoint, options }));

		return new Promise((resolve, reject) => {
			worker.onmessage = function (event) {
				const { type, data } = event.data;

				if (type === 'apiResponse') {
					resolve(data);
				} else {
					reject(new Error('There was some error.'));
				}
			};
		});
	}
	return {
		fetchAPIData,
	};
}

export default useWebWorker;
