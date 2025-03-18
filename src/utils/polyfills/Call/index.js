/**
 * Polyfill for Function.prototype.call
 * @param {any} context - The value of 'this' provided for the call
 * @param {...any} args - Arguments to pass to the function
 * @returns {any} Result of calling the function
 * @throws {TypeError} If called on a non-function
 */

Function.prototype.myCall = function (context, ...args) {
	// Check if the function is callable
	if (typeof this !== 'function') {
		throw new TypeError('myCall must be called on a function');
	}

	// Handle null/undefined context
	context = context === null || context === undefined ? globalThis : Object(context);

	if (!Object.isExtensible(context)) {
		throw new TypeError('Context object is non-extensible');
	}

	const fnRef = 'myCall';

	if (fnRef in context) {
		throw new Error('Property collision detected');
	}

	// Bind the function to the context
	context[fnRef] = this;

	try {
		return context[fnRef](...args);
	} catch (e) {
		console.error(e);
	} finally {
		delete context[fnRef];
	}
};
