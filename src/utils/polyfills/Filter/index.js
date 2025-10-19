'use strict';

function myFilter(fn, thisArg) {
	if (!Array.isArray(this)) {
		throw new TypeError('myFilter called on non-array');
	}

	// 2. Convert this to Object (handles primitives)
	const O = Object(this);

	// 3. Proper length handling - ToLength operation
	const len = O.length >>> 0; // Convert to unsigned 32-bit integer

	// 4. Function check with detailed error
	if (typeof fn !== 'function') {
		throw new TypeError(
			'Filter callback must be a function, got: ' + (fn === null ? 'null' : typeof fn),
		);
	}

	// 5. Initialize result array - no pre-allocation
	const resultArr = [];

	// 6. Iterate and handle sparse arrays properly
	for (let i = 0; i < len; i++) {
		if (i in O) {
			// Check for sparse arrays
			const element = O[i];
			const shouldInclude = fn.call(thisArg, element, i, O);
			// 7. Proper boolean coercion
			if (shouldInclude) {
				resultArr.push(element);
			}
		}
	}

	return resultArr;
}

// 8. Safe installation as non-enumerable property
if (!Array.prototype.myFilter) {
	Object.defineProperty(Array.prototype, 'myFilter', {
		value: myFilter,
		enumerable: false, // Don't show up in for...in loops
		configurable: false, // Can't be deleted or reconfigured
		writable: false, // Can't be overwritten
	});
}

// Example usage and edge cases
function demonstrateEdgeCases() {
	// Test 1: Sparse arrays
	const sparseArray = new Array(3);
	sparseArray[1] = 2;
	console.log(sparseArray.myFilter((x) => x > 1)); // [2]

	// Test 2: Very large length
	const fakeArray = { length: Math.pow(2, 53), 0: 1, 1: 2 };
	Array.prototype.myFilter.call(fakeArray, (x) => x > 1); // Works with large length

	// Test 3: Primitive this value
	Array.prototype.myFilter.call('123', (char) => char > 1); // Works with string

	// Test 4: Callback receiving correct arguments
	[1].myFilter(
		function (value, index, array) {
			console.log(this); // thisArg value
			console.log(value, index, array); // Proper arguments
			return true;
		},
		{ custom: 'thisArg' },
	);

	// Test 5: Non-boolean return values
	[1, 2, 3].myFilter((x) => x); // [1,2,3] - truthy values
	[1, 2, 3].myFilter((x) => 0); // [] - falsy values
}
