import { deepCopy } from './deepCopy';
import { isArray, isObject } from './typeChecking';

export const alphabets = [
	'a',
	'b',
	'c',
	'd',
	'e',
	'f',
	'g',
	'h',
	'i',
	'j',
	'k',
	'l',
	'm',
	'n',
	'o',
	'p',
	'q',
	'r',
	's',
	't',
	'u',
	'v',
	'w',
	'x',
	'y',
	'z',
];

export const getArrayCount = <T>(arr: T[]): number => (isArray(arr) && arr.length) || 0;

/**
 * Shuffles a given array
 * Randomize the indexes
 */
export const shuffle = <T>(arr: T[]): T[] => {
	if (!isArray(arr)) {
		throw new Error('Please provide a valid array');
	}

	const newArray = deepCopy(arr);

	newArray.sort(function () {
		return Math.random() - 0.5;
	});

	return newArray;
};

/**
 * Create equal chunks of the given array by size
 */
export const arrayChunks = <T>(a: T[], size: number): T[][] =>
	Array.from(new Array(Math.ceil(a.length / size)), (_, i) =>
		a.slice(i * size, i * size + size),
	);

/**
 * Performs a shallow comparison between two values (primitives, arrays, or objects).
 * @param a The first value to compare
 * @param b The second value to compare
 * @returns True if the values are shallowly equal, false otherwise
 */
export function shallowEqual(a: unknown, b: unknown): boolean {
	// Different types cannot be equal
	if (typeof a !== typeof b) return false;

	// Same reference or primitive equality
	if (a === b) return true;

	// Handle arrays by checking if both are arrays
	if (isArray(a) && isArray(b)) {
		if (a.length !== b.length) return false;

		for (let i = 0; i < a.length; i++) {
			if (a[i] !== b[i]) return false;
		}
		return true;
	}

	// Handle objects by checking if both are objects
	if (isObject(a) && isObject(b)) {
		const keysA = Object.keys(a);
		const keysB = Object.keys(b);

		if (keysA.length !== keysB.length) return false;

		// Use a type assertion to tell TypeScript that a and b are objects that can be indexed by a string.
		const objA = a as Record<string, unknown>;
		const objB = b as Record<string, unknown>;

		for (const key of keysA) {
			if (!(key in objB) || objA[key] !== objB[key]) return false;
		}
		return true;
	}

	// For primitives that aren't strictly equal, return false
	return false;
}

/**
 * Performs a deep comparison between two values (primitives, arrays, or objects).
 * @param a The first value to compare
 * @param b The second value to compare
 * @returns True if the values are shallowly equal, false otherwise
 */
export function deepEqual(a: unknown, b: unknown): boolean {
	// Different types cannot be equal
	if (typeof a !== typeof b) return false;

	// Same reference or primitive equality
	if (a === b) return true;

	// Handle arrays by checking if both are arrays
	if (isArray(a) && isArray(b)) {
		if (a.length !== b.length) return false;

		for (let i = 0; i < a.length; i++) {
			if (!deepEqual(a[i], b[i])) return false;
		}
		return true;
	}

	// Handle objects by checking if both are objects
	if (isObject(a) && isObject(b)) {
		const keysA = Object.keys(a);
		const keysB = Object.keys(b);

		if (keysA.length !== keysB.length) return false;

		// Use a type assertion to tell TypeScript that a and b are objects that can be indexed by a string.
		const objA = a as Record<string, unknown>;
		const objB = b as Record<string, unknown>;

		for (const key of keysA) {
			if (!(key in objB) || !deepEqual(objA[key], objB[key])) return false;
		}
		return true;
	}

	// For primitives that aren't strictly equal, return false
	return false;
}
