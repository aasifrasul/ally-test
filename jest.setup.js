// jest.setup.js
require('@testing-library/jest-dom');

function noOp() {}

if (typeof window.URL.createObjectURL === 'undefined') {
	Object.defineProperty(window.URL, 'createObjectURL', { value: noOp });
}

// Mock Worker
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

// Mock IntersectionObserver
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

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
	return setTimeout(callback, 0);
});

global.cancelAnimationFrame = jest.fn((id) => {
	clearTimeout(id);
});

// Mock Date.now for consistent timing tests
const originalDateNow = Date.now;
global.mockDateNow = jest.fn(() => 1000000);
Date.now = global.mockDateNow;

// Helper function for advancing time in tests
global.advanceTimersByTime = (ms) => {
	const currentTime = global.mockDateNow();
	global.mockDateNow.mockImplementation(() => currentTime + ms);
	jest.advanceTimersByTime(ms);
};

// Cleanup function to restore original implementations after tests
afterEach(() => {
	if (global.__CLEANUP_FUNCTIONS__) {
		global.__CLEANUP_FUNCTIONS__.forEach((fn) => fn());
		global.__CLEANUP_FUNCTIONS__ = [];
	}
});

// Add a cleanup registry
global.__CLEANUP_FUNCTIONS__ = [];
