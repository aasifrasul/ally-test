/**
 * Polyfill for the bind method
 * @param {Object} context - The context to bind to the function.
 * MDN - The value of this provided for the call to func.
 * If the function is not in strict mode,
 * null and undefined will be replaced with the global object,
 * and primitive values will be converted to objects.
 * @param {...*} boundArgs - Arguments to bind to the function
 * @returns {Function} - The bound function
 * @throws {TypeError} - If called on a non-function
 */
Function.prototype.myBind = function (context, ...boundArgs) {
	if (typeof this !== 'function') {
		throw new TypeError('bind is called on a non function');
	}

	const originalFunc = this;

	// Handle null/undefined context (non-strict mode behavior)
	if (context == null) {
		context = globalThis;
	} else {
		context = Object(context);
	}

	const boundFunction = function (...args) {
		const finalArgs = [...boundArgs, ...args];

		// Handle being used as a constructor
		if (new.target) {
			return new originalFunc(...finalArgs);
		}

		// Use call/apply instead of property assignment
		return originalFunc.apply(context, finalArgs);
	};

	// Set up prototype chain for constructor calls
	if (originalFunc.prototype) {
		boundFunction.prototype = Object.create(originalFunc.prototype);
	}

	// Preserve function length
	Object.defineProperty(boundFunction, 'length', {
		value: Math.max(0, originalFunc.length - boundArgs.length),
		configurable: true,
	});

	return boundFunction;
};
