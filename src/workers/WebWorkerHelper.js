// WebWorkerHelper.js

export default class WebWorkerHelper {
	constructor(worker) {
		let code = worker.toString();
		code = code.substring(code.indexOf('{') + 1, code.lastIndexOf('}'));
		const blob = new Blob([code], { type: 'application/javascript' });
		const blobUrl = URL.createObjectURL(blob);
		return new Worker(blobUrl);
	}
}
