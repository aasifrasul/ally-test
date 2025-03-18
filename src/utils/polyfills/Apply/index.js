/**
 * Custom implementation of Function.prototype.apply
 * @param {Object} context - The context to bind to the function.
 * MDN - The value of this provided for the call to func.
 *  If the function is not in strict mode,
 *  null and undefined will be replaced with the global object,
 *  and primitive values will be converted to objects.
 * @param {Array} args - The arguments to pass to the function.
 * MDN - An array-like object, specifying the arguments with which func should be called,
 *  or null or undefined if no arguments should be provided to the function.
 * @returns {*} - The result of the function
 */

Function.prototype.myApply = function (context, args) {
	if (typeof this !== 'function') {
		throw new TypeError('myApply is called on a non function');
	}

	if (args && !Array.isArray(args)) {
		throw new TypeError('Second parameter must be an array or null');
	}

	// Handle null/undefined context
	context = context === null || context === undefined ? globalThis : Object(context);

	const fnRef = 'myApply';

	if (fnRef in context) {
		throw new Error('Property collision detected');
	}

	// Store function temporarily
	context[fnRef] = this;

	try {
		// Execute with spread operator
		return context[fnRef](...(args || []));
	} catch (e) {
		console.error(e);
	} finally {
		// Clean up
		delete context[fnRef];
	}
};
