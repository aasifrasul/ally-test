interface Function {
	clone(): this;
}

Function.prototype.clone = function () {
	const cloneTarget = Symbol.for('cloneTarget');
	const targetFn: Function = (this as any)[cloneTarget] ?? this;

	// Create clone function that calls the original
	const clone: Function = function (this: any, ...args: any[]): any {
		return targetFn.apply(this, args);
	} as any;

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
			(clone as any)[key] = (targetFn as any)[key];
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
	(clone as any)[cloneTarget] = targetFn;

	return clone as any;
};
