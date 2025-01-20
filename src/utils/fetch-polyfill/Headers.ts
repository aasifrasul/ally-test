import { HeadersInit, HeadersIterator } from './types';
import { normalizeName, normalizeValue } from './helpers';

class HeadersIteratorImpl<T> implements HeadersIterator<T> {
	private items: T[];
	private index: number = 0;

	constructor(items: T[]) {
		this.items = items;
	}

	next(): IteratorResult<T> {
		if (this.index >= this.items.length) {
			return { done: true, value: undefined };
		}
		return {
			done: false,
			value: this.items[this.index++],
		};
	}

	[Symbol.iterator](): HeadersIterator<T> {
		return this;
	}
}

export class Headers {
	private map: Map<string, string>;

	constructor(headers?: Headers | [string, string][] | HeadersInit) {
		this.map = new Map();

		if (headers instanceof Headers) {
			headers.forEach((value: string, name: string) => {
				this.append(name, value);
			});
		} else if (Array.isArray(headers)) {
			(headers as [string, string][]).forEach(([name, value]: [string, string]) => {
				this.append(name, value);
			});
		} else if (headers) {
			Object.getOwnPropertyNames(headers).forEach((name: string) => {
				this.append(name, (headers as Record<string, string>)[name]);
			});
		}
	}

	append(name: string, value: string): void {
		const normalizedName = normalizeName(name);
		const normalizedValue = normalizeValue(value);
		const existingValue = this.map.get(normalizedName);
		this.map.set(
			normalizedName,
			existingValue ? `${existingValue}, ${normalizedValue}` : normalizedValue,
		);
	}

	delete(name: string): void {
		this.map.delete(normalizeName(name));
	}

	get(name: string): string | null {
		const normalizedName = normalizeName(name);
		return this.map.get(normalizedName) ?? null;
	}

	has(name: string): boolean {
		return this.map.has(normalizeName(name));
	}

	set(name: string, value: string): void {
		this.map.set(normalizeName(name), normalizeValue(value));
	}

	getSetCookie(): string[] {
		return [];
	}

	forEach(
		callback: (value: string, name: string, headers: Headers) => void,
		thisArg?: any,
	): void {
		this.map.forEach((value, name) => {
			callback.call(thisArg, value, name, this);
		});
	}

	keys(): HeadersIterator<string> {
		return new HeadersIteratorImpl(Array.from(this.map.keys()));
	}

	values(): HeadersIterator<string> {
		return new HeadersIteratorImpl(Array.from(this.map.values()));
	}

	entries(): HeadersIterator<[string, string]> {
		return new HeadersIteratorImpl(Array.from(this.map.entries()));
	}

	[Symbol.iterator](): HeadersIterator<[string, string]> {
		return this.entries();
	}
}
