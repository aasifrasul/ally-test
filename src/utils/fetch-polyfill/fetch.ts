import { parseHeaders, support } from './helpers';
import { DOMException } from './helpers';
import { Request } from './Request';
import { Response } from './Response';
import { RequestInit, ResponseInit } from './types';

type RequestInfo = Request | string;

export function fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
	return new Promise<Response>((resolve, reject) => {
		const request = new Request(input, init);

		if (request.signal?.aborted) {
			return reject(new DOMException('Aborted', 'AbortError'));
		}

		const xhr = new XMLHttpRequest();

		function abortXhr(): void {
			xhr.abort();
		}

		xhr.onload = function (this: XMLHttpRequest) {
			const options: ResponseInit = {
				status: this.status,
				statusText: this.statusText,
				headers: parseHeaders(this.getAllResponseHeaders() || ''),
			};

			const responseURL =
				'responseURL' in this
					? this.responseURL
					: options.headers && options.headers.get('X-Request-URL');

			options.url = responseURL;

			// Handle different response types appropriately
			let body: any;
			if (this.responseType === 'blob') {
				body = this.response;
			} else {
				// For text responses or when responseType is not set
				try {
					body = this.responseText;
				} catch (e) {
					// If responseText is not accessible, fall back to response
					body = this.response;
				}
			}

			resolve(new Response(body, options));
		};

		xhr.onerror = function () {
			reject(new TypeError('Network request failed'));
		};

		xhr.ontimeout = function () {
			reject(new TypeError('Network request failed'));
		};

		xhr.onabort = function () {
			reject(new DOMException('Aborted', 'AbortError'));
		};

		xhr.open(request.method, request.url, true);

		if (request.credentials === 'include') {
			xhr.withCredentials = true;
		} else if (request.credentials === 'omit') {
			xhr.withCredentials = false;
		}

		// Only set responseType to blob if explicitly requested in the headers
		if ('responseType' in xhr && support.blob) {
			const expectsBlob =
				request.headers.get('Accept')?.includes('blob') ||
				request.headers.get('Accept')?.includes('application/octet-stream');
			xhr.responseType = expectsBlob ? 'blob' : '';
		}

		request.headers.forEach((value: string, name: string) => {
			xhr.setRequestHeader(name, value);
		});

		if (request.signal) {
			request.signal.addEventListener('abort', abortXhr);

			xhr.onreadystatechange = function () {
				if (xhr.readyState === 4) {
					request.signal?.removeEventListener('abort', abortXhr);
				}
			};
		}

		const bodyInit = (request as unknown as { _bodyInit: any })._bodyInit;
		xhr.send(typeof bodyInit === 'undefined' ? null : bodyInit);
	});
}
