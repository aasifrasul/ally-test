const idx = require('idx');

const alphabets = [
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

const getArrayCount = (arr) => idx(arr, (_) => _.length) || 0;

const buildNestedWithParentId = (arr) => {
	const nestedStructure = Object.create(null);
	const categories = [];
	const uniqueCategories = {};
	let elem;

	for (var i = 0; i < arr.length; i++) {
		elem = arr[i];

		if (elem.parent_objective_id) {
			const parentElem = nestedStructure[elem.parent_objective_id];
			if (!parentElem) {
				continue;
			}
			if (!parentElem.children) {
				parentElem.children = [];
			}
			parentElem.children.push(elem);
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

module.exports = {
	alphabets,
	getArrayCount,
	buildNestedWithParentId,
};
