import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { QueryParams } from '../constants/types';
import { isNumber } from './typeChecking';

export const getRandomInt = (min = 1000 * 1000, max = 2000 * 1000): number => {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min) + min);
};

export function compareStrings(item1: string, item2: string): number {
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

export const debounce = <T extends (...args: any[]) => any>(
	fn: T,
	delay: number,
): ((...args: Parameters<T>) => Promise<void>) => {
	let timeoutId: NodeJS.Timeout | null = null;

	return function wrapper(this: any, ...args: Parameters<T>): Promise<void> {
		clearTimeout(timeoutId!);

		return new Promise((resolve) => {
			timeoutId = setTimeout(() => {
				fn.apply(this, args);
				clearTimeout(timeoutId!);
				resolve();
			}, delay);
		});
	};
};

export const arraySortLexicalOrder = <T>(
	items: T[],
	isAsc: boolean = true,
	field?: keyof T,
): T[] =>
	[...items].sort((item1: T, item2: T) => {
		const str1 = field ? item1[field] : item1;
		const str2 = field ? item2[field] : item2;
		return isAsc
			? compareStrings(String(str1), String(str2))
			: compareStrings(String(str2), String(str1));
	});

export const sortMixedArray = <T>(items: T[], isAsc: boolean = true, field?: keyof T): T[] =>
	[...items].sort((item1: T, item2: T) => {
		const str1 = field ? item1[field] : item1;
		const str2 = field ? item2[field] : item2;
		if (isNumber(str1) && isNumber(str2)) {
			return isAsc ? Number(str1) - Number(str2) : Number(str2) - Number(str1);
		} else {
			return isAsc
				? String(str1).localeCompare(String(str2))
				: String(str2).localeCompare(String(str1));
		}
	});

export const searchTextOnData = (
	searchText: string,
	searchData: any[],
	searchFields: (keyof any)[],
): any[] => {
	const lowerCasedSearchText = searchText?.toLowerCase();
	const data = [...searchData];

	return lowerCasedSearchText
		? data.filter((item) =>
				searchFields.some(
					(field) => item[field]?.toLowerCase().includes(lowerCasedSearchText),
				),
			)
		: data;
};

export const buildQueryParams = (queryParams: QueryParams): string =>
	Object.entries(queryParams)
		.filter(([, value]) => value !== undefined && value !== null)
		.map(([key, value]) => {
			const encodedValue =
				typeof value === 'object'
					? encodeURIComponent(JSON.stringify(value))
					: encodeURIComponent(value as string | number | boolean);
			return `${encodeURIComponent(key)}=${encodedValue}`;
		})
		.join('&');

export const range = (start: number, end: number): IterableIterator<number> => {
	let n = start;
	return {
		next() {
			console.log('range next');
			if (n > end) {
				return { done: true, value: null };
			}
			return { done: false, value: n++ };
		},
		[Symbol.iterator]() {
			return this;
		},
	};
};

export function mapIterable<T>(
	iterable: Iterable<T>,
	callback: (value: T) => T,
): IterableIterator<T> {
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
		[Symbol.iterator]() {
			return this;
		},
	};
}

export function* createRangeIterator(
	start: number = 0,
	end: number = Infinity,
	step: number = 1,
): Generator<number, void, unknown> {
	let iterationCount = 0;
	for (let i = start; i < end; i += step) {
		iterationCount++;
		yield i;
	}
	// return iterationCount;
}

/**
 * Utility function to merge and dedupe Tailwind CSS classes
 * @param inputs - Array of class names, objects, or arrays
 * @returns Merged and deduped class string
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}
