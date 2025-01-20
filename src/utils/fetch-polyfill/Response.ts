import { Headers } from './Headers';
import { ResponseInit, BodyInit, Type } from './types';

export class Response {
	readonly type: Type;
	readonly status: number;
	readonly ok: boolean;
	readonly statusText: string;
	readonly headers: Headers;
	readonly url: string;
	private _bodyInit: BodyInit;
	private _bodyText: string | null;
	private _bodyBlob: Blob | null;
	private _bodyArrayBuffer: ArrayBuffer | null;
	private _bodyFormData: FormData | null;

	constructor(bodyInit: BodyInit = null, options: ResponseInit = {}) {
		this.type = options.type ?? 'default';
		this.status = options.status ?? 200;
		this.ok = this.status >= 200 && this.status < 300;
		this.statusText = options.statusText ?? 'OK';
		this.headers = new Headers(options.headers);
		this.url = options.url ?? '';

		this._bodyInit = bodyInit;
		this._bodyText = null;
		this._bodyBlob = null;
		this._bodyArrayBuffer = null;
		this._bodyFormData = null;

		this._initBody(bodyInit);
	}

	clone(): Response {
		return new Response(this._bodyInit, {
			status: this.status,
			statusText: this.statusText,
			headers: new Headers(this.headers),
			url: this.url,
		});
	}

	async text(): Promise<string> {
		if (this._bodyText !== null) {
			return this._bodyText;
		}

		if (this._bodyBlob !== null) {
			return this._bodyBlob.text();
		}

		if (this._bodyArrayBuffer !== null) {
			return new TextDecoder().decode(this._bodyArrayBuffer);
		}

		if (this._bodyFormData !== null) {
			throw new Error('Could not read FormData body as text');
		}

		return Promise.resolve(this._bodyText ?? '');
	}

	async json(): Promise<any> {
		const text = await this.text();
		return JSON.parse(text);
	}

	async blob(): Promise<Blob> {
		if (this._bodyBlob !== null) {
			return this._bodyBlob;
		}

		if (this._bodyArrayBuffer !== null) {
			return new Blob([this._bodyArrayBuffer]);
		}

		throw new Error('Could not read body as Blob');
	}

	async arrayBuffer(): Promise<ArrayBuffer> {
		if (this._bodyArrayBuffer !== null) {
			return this._bodyArrayBuffer;
		}

		if (this._bodyBlob !== null) {
			return await this._bodyBlob.arrayBuffer();
		}

		const text = await this.text();
		return new TextEncoder().encode(text).buffer as ArrayBuffer;
	}

	async formData(): Promise<FormData> {
		if (this._bodyFormData !== null) {
			return this._bodyFormData;
		}

		throw new Error('Could not read body as FormData');
	}

	static error(): Response {
		const response = new Response(null, { status: 0, statusText: '', type: 'error' });
		// response.type = 'error';
		return response;
	}

	static redirect(url: string, status: number = 302): Response {
		const redirectStatuses = [301, 302, 303, 307, 308];
		if (!redirectStatuses.includes(status)) {
			throw new RangeError('Invalid status code');
		}

		return new Response(null, {
			status,
			headers: { location: url },
		});
	}

	private _initBody(body: BodyInit): void {
		if (body === null) {
			this._bodyText = '';
			return;
		}

		if (typeof body === 'string') {
			this._bodyText = body;
			return;
		}

		if (body instanceof Blob) {
			this._bodyBlob = body;
			return;
		}

		if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
			this._bodyArrayBuffer =
				body instanceof ArrayBuffer ? body : (body.buffer as ArrayBuffer);
			return;
		}

		if (body instanceof FormData) {
			this._bodyFormData = body;
			return;
		}

		if (body instanceof URLSearchParams) {
			this._bodyText = body.toString();
			return;
		}

		// If none of the above, try to stringify
		this._bodyText = JSON.stringify(body);
	}
}
