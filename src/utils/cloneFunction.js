Function.prototype.clone = function () {
	const cloneTarget = Symbol.for('cloneTarget');
	const targetFn = this[cloneTarget] ?? this;

	// Create clone function that calls the original
	function clone(...args) {
		return targetFn.apply(this, args);
	}

	// Copy all properties including non-enumerable ones
	const propertyNames = Object.getOwnPropertyNames(targetFn);
	const symbols = Object.getOwnPropertySymbols(targetFn);

	[...propertyNames, ...symbols].forEach((key) => {
		// Skip the cloneTarget symbol and non-configurable properties
		if (key === cloneTarget) return;

		try {
			const descriptor = Object.getOwnPropertyDescriptor(targetFn, key);
			if (descriptor) {
				Object.defineProperty(clone, key, descriptor);
			}
		} catch (e) {
			// Some properties might not be configurable or writable
			clone[key] = targetFn[key];
		}
	});

	// Set correct name and length if possible
	Object.defineProperties(clone, {
		name: { value: targetFn.name, configurable: true },
		length: { value: targetFn.length, configurable: true },
	});

	// Preserve prototype chain
	if (targetFn.prototype) {
		clone.prototype = Object.create(targetFn.prototype);
		clone.prototype.constructor = clone;
	}

	// Mark this as a clone and remember the target
	clone[cloneTarget] = targetFn;

	return clone;
};
