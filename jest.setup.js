// setup file
require('@testing-library/jest-dom');

// setupTests.js
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
