// Utility functions for creating transducers

export function mapAndFilterTransducer(mapping, filtering) {
	return (reducer) => {
		return (accumulator, current) => {
			const mapped = mapping(current);
			return filtering(mapped) ? reducer(accumulator, mapped) : accumulator;
		};
	};
}

/**
 * const doubleEvens = mapAndFilterTransducer(
  x => x * 2,           // mapping function
  x => x % 2 === 0      // filtering function
);

// Using the transducer
const result = [1, 2, 3, 4, 5, 6].reduce(
  doubleEvens((acc, val) => acc.concat(val)), 
  []
);
console.log(result); // [4, 8, 12]
*/

export const map = (fn) => (reducer) => {
	return (accumulator, current) => {
		return reducer(accumulator, fn(current));
	};
};

export const filter = (predicate) => (reducer) => {
	return (accumulator, current) => {
		return predicate(current) ? reducer(accumulator, current) : accumulator;
	};
};

// Compose multiple transducers
export const compose = (...fns) => {
	return fns.reduce(
		(f, g) =>
			(...args) =>
				f(g(...args)),
	);
};

export const arrayReducer = (acc, val) => [...acc, val];

/**
 * 
 * // Creating a complex transducer
const processNumbers = compose(
  map(x => x * 2),           // Double each number
  filter(x => x > 10),        // Keep only numbers > 10
  filter(x => x % 4 === 0)    // Keep only multiples of 4
);

// Apply the transducer
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const result = numbers.reduce(
  processNumbers(arrayReducer), 
  []
);

console.log(result);
// Output: [24]
*/

export const transduce = (transducer, reducer, initialValue, arr) => {
	return arr.reduce(transducer(reducer), initialValue);
};

// Async transducer for processing promises
export const asyncTransducer = compose(
	map(async (x) => {
		// Simulate async operation
		await new Promise((resolve) => setTimeout(resolve, 100));
		return x * 2;
	}),
	filter((x) => x > 10),
);
