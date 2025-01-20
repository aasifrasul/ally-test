import { RequestInit, RequestMode, RequestCredentials, BodyInit } from './types';
import { normalizeMethod } from './helpers';
import { Body } from './Body';

export class Request {
	readonly url: string;
	readonly credentials: RequestCredentials;
	readonly headers: Headers;
	readonly method: string;
	readonly mode: RequestMode;
	readonly signal: AbortSignal | null;
	readonly referrer: string | null;
	protected _bodyInit: BodyInit | null = null;
	bodyUsed: boolean = false;

	constructor(input: Request | string, options: RequestInit = {}) {
		// Initialize default values
		this.credentials = 'same-origin';
		this.headers = new Headers();
		this.method = 'GET';
		this.mode = null;
		this.signal = null;
		this.referrer = null;

		// Handle input based on type
		if (input instanceof Request) {
			if (input.bodyUsed) {
				throw new TypeError('Already read');
			}
			this.url = input.url;
			this.credentials = input.credentials;
			if (!options.headers) {
				this.headers = new Headers(input.headers);
			}
			this.method = input.method;
			this.mode = input.mode;
			this.signal = input.signal;

			// Handle body from input request
			if (!options.body && input._bodyInit !== null) {
				this._bodyInit = input._bodyInit;
				input.bodyUsed = true;
			}
		} else {
			this.url = String(input);
		}

		// Apply options
		this.credentials = (options.credentials as RequestCredentials) || this.credentials;
		if (options.headers) {
			this.headers = new Headers(Object.entries(options.headers));
		}
		this.method = normalizeMethod(options.method || this.method);
		this.mode = (options.mode as RequestMode) || this.mode;
		this.signal = options.signal || this.signal;

		// Handle body initialization
		if ((this.method === 'GET' || this.method === 'HEAD') && options.body) {
			throw new TypeError('Body not allowed for GET or HEAD requests');
		}
		this._initBody(options.body);
	}

	protected _initBody(body: BodyInit | null | undefined): void {
		this._bodyInit = body || null;
		if (body) {
			this.bodyUsed = true;
		}
	}

	clone(): Request {
		return new Request(this, { body: this._bodyInit });
	}
}
