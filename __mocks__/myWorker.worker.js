class Worker {
	constructor(stringUrl) {
		this.url = stringUrl;
		this.onmessage = () => {};
	}

	postMessage(msg) {
		this.onmessage(msg);
	}
}

global.Worker = Worker;
window.Worker = Worker;

export default Worker;
