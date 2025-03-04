import { deepCopy } from './deepCopy';

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

export const getArrayCount = <T>(arr: T[]): number => (Array.isArray(arr) && arr.length) || 0;

/**
 * Shuffles a given array
 * Randomize the indexes
 */
export const shuffle = <T>(arr: T[]): T[] => {
	if (!Array.isArray(arr)) {
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
