export interface XMLHttpRequestResponseType {
	blob: Blob;
	text: string;
}

export type Type = 'basic' | 'cors' | 'default' | 'error' | 'opaque' | 'opaqueredirect';

export interface Support {
	searchParams: boolean;
	iterable: boolean;
	blob: boolean;
	formData: boolean;
	arrayBuffer: boolean;
}

// Define a proper Headers iterator interface
export interface HeadersIterator<T> extends Iterator<T> {
	next(): IteratorResult<T>;
	[Symbol.iterator](): HeadersIterator<T>;
}

export interface IteratorResult<T> {
	done: boolean;
	value: T | undefined;
}

export interface Iterator<T> {
	next(): IteratorResult<T>;
	[Symbol.iterator]?(): Iterator<T>;
}

export interface RequestInit {
	body?: BodyInit;
	headers?: HeadersInit;
	method?: string;
	mode?: string;
	signal?: AbortSignal;
	credentials?: string;
}

export interface ResponseInit {
	status?: number;
	statusText?: string;
	headers?: HeadersInit;
	url?: string;
	type?: Type;
}

export type BodyInit =
	| Blob
	| ArrayBuffer
	| DataView
	| FormData
	| URLSearchParams
	| string
	| null;

export interface Body {
	bodyUsed: boolean;
	arrayBuffer(): Promise<ArrayBuffer>;
	blob(): Promise<Blob>;
	formData(): Promise<FormData>;
	json(): Promise<any>;
	text(): Promise<string>;
}

export type RequestMode = 'navigate' | 'same-origin' | 'no-cors' | 'cors' | null;
export type RequestCredentials = 'omit' | 'same-origin' | 'include';
export type HeadersInit = Headers | string[][] | Record<string, string>;
