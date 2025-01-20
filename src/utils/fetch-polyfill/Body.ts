import { support, bufferClone, isArrayBufferView } from './helpers';
import { Headers } from './Headers';

interface InitBody {
	bodyUsed: boolean;
	_initBody(body: InitBody): void;
	_bodyInit: InitBody | null;
	_bodyText: string;
	_bodyBlob: Blob | null;
	_bodyArrayBuffer: ArrayBuffer | null;
	_bodyFormData: FormData | null;
	headers: Headers;
}

export class Body implements InitBody {
	bodyUsed: boolean;
	_bodyInit: InitBody | null;
	_bodyText: string;
	_bodyBlob: Blob | null;
	_bodyArrayBuffer: ArrayBuffer | null;
	_bodyFormData: FormData | null;
	headers: Headers;

	constructor() {
		this.bodyUsed = false;
		this._bodyInit = null;
		this._bodyText = '';
		this._bodyBlob = null;
		this._bodyArrayBuffer = null;
		this._bodyFormData = null;
		this.headers = new Headers();
	}

	_initBody(body: InitBody): void {
		this._bodyInit = body;

		if (!body) {
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

		if (body instanceof FormData) {
			this._bodyFormData = body;
			return;
		}

		if (body instanceof URLSearchParams) {
			this._bodyText = body.toString();
			return;
		}

		if (body instanceof DataView && support.blob && support.arrayBuffer) {
			this._bodyArrayBuffer = bufferClone(body.buffer as ArrayBuffer);
			this._bodyBlob = new Blob([this._bodyArrayBuffer]);
			return;
		}

		if (support.arrayBuffer && (body instanceof ArrayBuffer || isArrayBufferView(body))) {
			this._bodyArrayBuffer = bufferClone(body);
			return;
		}

		this._bodyText = String(Object.prototype.toString.call(body));
		body = this._bodyText as unknown as InitBody;

		if (!this.headers.get('content-type')) {
			if (typeof body === 'string') {
				this.headers.set('content-type', 'text/plain;charset=UTF-8');
			} else if (this._bodyBlob && this._bodyBlob.type) {
				this.headers.set('content-type', this._bodyBlob.type);
			} else if (body instanceof URLSearchParams) {
				this.headers.set(
					'content-type',
					'application/x-www-form-urlencoded;charset=UTF-8',
				);
			}
		}
	}

	// ... other methods (blob, arrayBuffer, text, formData, json)
}
