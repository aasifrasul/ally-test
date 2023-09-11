import { isNumber } from './typeChecking';

export const getRandomInt = (min = 1000 * 1000, max = 2000 * 1000) => {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min) + min);
};

/**
 * Creates a deep copy of a given object/array
 * Usual ways create a shallow copy
 * For truly deep copy each nested item has to be iterated over and a copy be created.
 * Special handling is needed for array/object/time as they are passed by reference
 */
export const deepCopy = (obj) => {
	const dataType = Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();

	const buildChildCopies = () => {
		const newObj = obj.constructor();

		Reflect.ownKeys(obj).forEach((key) => {
			obj['isActiveClone'] = true;
			newObj[key] = deepCopy(obj[key]);
			delete obj['isActiveClone'];
		});

		return newObj;
	};

	switch (dataType) {
		case 'undefined':
		case 'null':
		case 'string':
		case 'boolean':
		case 'number':
		case 'function':
		case 'regexp':
			return obj;
		case 'date':
			return new obj.constructor(obj);
		case 'object':
			if ('isActiveClone' in obj) {
				return obj;
			}
			return buildChildCopies();
		case 'array':
			return buildChildCopies();
		default:
			return obj;
	}
};

export function compareStrings(item1, item2) {
	const str1 = String(item1);
	const str2 = String(item2);
	const length = Math.min(str1.length, str2.length);

	for (let i = 0; i < length; i++) {
		const char1 = str1.charCodeAt(i);
		const char2 = str2.charCodeAt(i);

		if (char1 < char2) {
			return -1;
		} else if (char1 > char2) {
			return 1;
		}
	}

	// If the loop finishes, one string is a prefix of the other.
	// The shorter string comes first in dictionary order.
	if (str1.length < str2.length) {
		return -1;
	} else if (str1.length > str2.length) {
		return 1;
	}

	// Both strings are equal
	return 0;
}

export const debounce = (fn, delay) => {
	let timeoutId;

	return function wrapper(...args) {
		const self = this;
		clearTimeout(timeoutId);

		timeoutId = setTimeout(() => {
			fn.apply(self, args);
			clearTimeout(timeoutId);
		}, delay);
	};
};

export const arraySortLexicalOrder = (items = [], isAsc = true, field = '') =>
	[...items].sort((item1, item2) => {
		const str1 = field && field in item1 ? item1[field] : item1;
		const str2 = field && field in item2 ? item2[field] : item2;
		return isAsc ? compareStrings(str1, str2) : compareStrings(str2, str1);
	});

export const sortMixedArray = (items = [], isAsc = true, field = '') =>
	[...items].sort((item1, item2) => {
		const str1 = field && field in item1 ? item1[field] : item1;
		const str2 = field && field in item2 ? item2[field] : item2;
		if (isNumber(str1) && isNumber(str2)) {
			return isAsc ? str1 - str2 : str2 - str1;
		} else {
			return isAsc
				? String(str1).localeCompare(String(str2))
				: String(str2).localeCompare(String(str1));
		}
	});

export const searchTextOnData = (searchText, searchData, searchFields) => {
	const lowerCasedSearchText = searchText?.toLowerCase();
	const data = [...searchData];

	return lowerCasedSearchText
		? data.filter((item) =>
				searchFields.some((field) =>
					item[field]?.toLowerCase().includes(lowerCasedSearchText)
				)
		  )
		: data;
};

export const buildQueryParams = (queryParams) =>
	Object.keys(queryParams).reduce((accu, key) => `${accu}&${key}=${queryParams[key]}`, '');

export const range = (start, end) => {
	return {
		[Symbol.iterator]() {
			let n = start;
			return {
				next() {
					console.log('range next');
					if (n > end) {
						return { done: true, value: null };
					}
					return { done: false, value: n++ };
				},
			};
		},
	};
};

export function mapIterable(iterable, callback) {
	return {
		[Symbol.iterator]() {
			const iterator = iterable[Symbol.iterator]();
			return {
				next() {
					const { done, value } = iterator.next();
					if (done) {
						return { done: true, value: null };
					}
					return { done, value: callback(value) };
				},
				return() {
					if (iterator.return) {
						iterator.return();
					}
					return { done: true, value: null };
				},
			};
		},
	};
}

export function* createRangeIterator(start = 0, end = Infinity, step = 1) {
	let iterationCount = 0;
	for (let i = start; i < end; i += step) {
		iterationCount++;
		yield i;
	}
	return iterationCount;
}
