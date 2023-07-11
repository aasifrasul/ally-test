// setup file
require('@testing-library/jest-dom');

function noOp() {}
if (typeof window.URL.createObjectURL === 'undefined') {
	Object.defineProperty(window.URL, 'createObjectURL', { value: noOp });
}

class WorkerMock {
	constructor(stringUrl) {
		this.url = stringUrl;
		this.onmessage = () => {};
	}

	postMessage(msg) {
		this.onmessage(msg);
	}
}

Object.defineProperty(window, 'Worker', {
	writable: true,
	configurable: true,
	value: WorkerMock,
});

class IntersectionObserverMock {
	constructor(callback, options) {}

	observe() {}

	unobserve() {}

	disconnect() {}
}

Object.defineProperty(window, 'IntersectionObserver', {
	writable: true,
	configurable: true,
	value: IntersectionObserverMock,
});
