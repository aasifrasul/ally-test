import { Iterator, IteratorResult, Support } from './types';
import { Headers } from './Headers';

const methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

// Support detection
export const support: Support = {
	searchParams: 'URLSearchParams' in self,
	iterable: 'Symbol' in self && 'iterator' in Symbol,
	blob:
		'FileReader' in self &&
		'Blob' in self &&
		((): boolean => {
			try {
				new Blob();
				return true;
			} catch (e) {
				return false;
			}
		})(),
	formData: 'FormData' in self,
	arrayBuffer: 'ArrayBuffer' in self,
};

export function isDataView(obj: any): obj is DataView {
	return obj && DataView.prototype.isPrototypeOf(obj);
}

export let isArrayBufferView: (obj: any) => boolean;

if (support.arrayBuffer) {
	const viewClasses = [
		'[object Int8Array]',
		'[object Uint8Array]',
		'[object Uint8ClampedArray]',
		'[object Int16Array]',
		'[object Uint16Array]',
		'[object Int32Array]',
		'[object Uint32Array]',
		'[object Float32Array]',
		'[object Float64Array]',
	];

	isArrayBufferView =
		ArrayBuffer.isView ||
		function (obj: any): boolean {
			return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1;
		};
}

export function normalizeName(name: string | number | boolean): string {
	if (typeof name !== 'string') {
		name = String(name);
	}
	if (/[^a-z0-9\-#$%&'*+.^_`|~]/i.test(name) || name === '') {
		throw new TypeError('Invalid character in header field name');
	}
	return name.toLowerCase();
}

export function normalizeValue(value: string | number | boolean): string {
	if (typeof value !== 'string') {
		value = String(value);
	}
	return value;
}

export function iteratorFor<T>(items: T[]): Iterator<T> {
	const iterator: Iterator<T> = {
		next: function (): IteratorResult<T> {
			const value = items.shift();
			return {
				done: value === undefined,
				value: value,
			};
		},
	};

	if (support.iterable) {
		iterator[Symbol.iterator] = function (): Iterator<T> {
			return iterator;
		};
	}

	return iterator;
}

const bodyUsedMap = new WeakMap<Body, boolean>();

export function consumed(body: Body): Promise<never> | undefined {
	if (body.bodyUsed || bodyUsedMap.get(body)) {
		return Promise.reject(new TypeError('Already read'));
	}
	bodyUsedMap.set(body, true);
}

export function fileReaderReady(reader: FileReader): Promise<string | ArrayBuffer | null> {
	return new Promise((resolve, reject) => {
		reader.onload = (): void => {
			resolve(reader.result);
		};
		reader.onerror = (): void => {
			reject(reader.error);
		};
	});
}

export function readBlobAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
	const reader = new FileReader();
	const promise = fileReaderReady(reader) as Promise<ArrayBuffer>;
	reader.readAsArrayBuffer(blob);
	return promise;
}

export function readBlobAsText(blob: Blob): Promise<string> {
	const reader = new FileReader();
	const promise = fileReaderReady(reader) as Promise<string>;
	reader.readAsText(blob);
	return promise;
}

export function readArrayBufferAsText(buf: ArrayBuffer): string {
	const view = new Uint8Array(buf);
	const chars: string[] = new Array(view.length);

	for (let i = 0; i < view.length; i++) {
		chars[i] = String.fromCharCode(view[i]);
	}
	return chars.join('');
}

export function bufferClone(buf: ArrayBuffer): ArrayBuffer {
	if (buf.slice) {
		return buf.slice(0);
	} else {
		const view = new Uint8Array(buf.byteLength);
		view.set(new Uint8Array(buf));
		return view.buffer;
	}
}

export function normalizeMethod(method: string): string {
	const upcased = method.toUpperCase();
	return methods.indexOf(upcased) > -1 ? upcased : method;
}

export function decode(body: string): FormData {
	const form = new FormData();
	body.trim()
		.split('&')
		.forEach((bytes) => {
			if (bytes) {
				const split = bytes.split('=');
				const name = split.shift()!.replace(/\+/g, ' ');
				const value = split.join('=').replace(/\+/g, ' ');
				form.append(decodeURIComponent(name), decodeURIComponent(value));
			}
		});
	return form;
}

export function parseHeaders(rawHeaders: string): Headers {
	const headers = new Headers();
	rawHeaders
		.replace(/\r?\n[\t ]+/g, ' ')
		.split(/\r?\n/)
		.forEach((line) => {
			const parts = line.split(':');
			const key = parts.shift()?.trim();
			if (key) {
				const value = parts.join(':').trim();
				headers.append(key, value);
			}
		});
	return headers;
}

declare const self: Window & typeof globalThis;

export let DOMException: {
	new (message?: string, name?: string): DOMException;
	prototype: DOMException;
} = (self as any).DOMException;

try {
	new DOMException();
} catch (err) {
	DOMException = function DOMException(this: DOMException, message?: string, name?: string) {
		Object.defineProperty(this, 'message', {
			configurable: true,
			enumerable: false,
			value: message || '',
			writable: true,
		});
		Object.defineProperty(this, 'name', {
			configurable: true,
			enumerable: false,
			value: name || 'Error',
			writable: true,
		});
		const error = new Error(message);
		this.stack = error.stack;
	} as any;

	DOMException.prototype = Object.create(Error.prototype);
	DOMException.prototype.constructor = DOMException;
}
