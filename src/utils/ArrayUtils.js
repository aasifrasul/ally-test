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

export const buildNestedWithParentId = (items) => {
	const nestedStructure = Object.create(null);
	const categories = [];
	const uniqueCategories = {};
	let elem;

	for (const key in items) {
		elem = items[key];
		if (elem.parent_objective_id) {
			const parentElem = nestedStructure[elem.parent_objective_id];
			if (parentElem) {
				if (!parentElem.children) {
					parentElem.children = [];
				}
				parentElem.children.push(elem);
			}
		} else {
			nestedStructure[elem.id] = elem;
			if (!uniqueCategories[elem.category]) {
				uniqueCategories[elem.category] = true;
				const category = Object.create(null);
				category.id = elem.id;
				category.title = elem.category;
				category.selected = false;
				category.key = 'category';
				categories.push(category);
			}
		}
	}

	return { nestedStructure, categories };
};

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
