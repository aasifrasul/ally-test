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

export const getArrayCount = (arr) => (Array.isArray(arr) && arr.length) || 0;

export const dupeArray = (arr) => Array.isArray(arr) && Array.prototype.slice.call(arr);

/**
 * Shuffles a given array
 * Randomize the indexes
 */
export const shuffle = (array) => {
	if (!Array.isArray(array)) {
		throw new Error('Please provide a valid array');
	}

	const newArray = JSON.parse(JSON.stringify(array));

	newArray.sort(function () {
		return Math.random() - 0.5;
	});

	return newArray;
};

/**
 * Create equal chunks of the given array by size
 */
export const arrayChunks = (a, size) =>
	Array.from(new Array(Math.ceil(a.length / size)), (_, i) =>
		a.slice(i * size, i * size + size),
	);
