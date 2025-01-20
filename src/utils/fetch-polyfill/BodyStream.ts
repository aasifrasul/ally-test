class BodyStream implements ReadableStream {
	private reader: ReadableStreamDefaultReader<Uint8Array>;
	private controller!: ReadableStreamDefaultController<Uint8Array>;

	constructor(private body: BodyInit) {
		this.locked = false;
		if (body instanceof ReadableStream) {
			this.reader = body.getReader();
		} else {
			const stream = new ReadableStream({
				start: (controller) => {
					this.controller = controller;
					this.pushData();
				},
			});
			this.reader = stream.getReader();
		}
	}
	locked: boolean;

	private async pushData(): Promise<void> {
		if (this.body instanceof Blob) {
			const arrayBuffer = await this.body.arrayBuffer();
			this.controller.enqueue(new Uint8Array(arrayBuffer));
		} else if (typeof this.body === 'string') {
			const encoder = new TextEncoder();
			this.controller.enqueue(encoder.encode(this.body));
		}
		this.controller.close();
	}

	// Implementation of ReadableStream interface
	cancel(): Promise<void> {
		return this.reader.cancel();
	}

	getReader(options?: { mode: 'byob' }): ReadableStreamBYOBReader;
	getReader(
		options?: ReadableStreamGetReaderOptions,
	): ReadableStreamDefaultReader<Uint8Array>;
	getReader(
		options?: ReadableStreamGetReaderOptions | { mode: 'byob' },
	): ReadableStreamDefaultReader<Uint8Array> | ReadableStreamBYOBReader {
		return this.reader;
	}

	pipeThrough<T>(transform: ReadableWritablePair<T, Uint8Array>): ReadableStream<T> {
		const readable = new ReadableStream({
			start: async (controller) => {
				try {
					while (true) {
						const { done, value } = await this.reader.read();
						if (done) break;
						controller.enqueue(value);
					}
					controller.close();
				} catch (error) {
					controller.error(error);
				}
			},
		});
		return readable.pipeThrough(transform);
	}

	pipeTo(dest: WritableStream): Promise<void> {
		return this.pipeThrough({
			writable: dest,
			readable: new ReadableStream(),
		}).getReader().closed;
	}

	tee(): [ReadableStream<Uint8Array>, ReadableStream<Uint8Array>] {
		const streams = new ReadableStream({
			start: async (controller) => {
				try {
					while (true) {
						const { done, value } = await this.reader.read();
						if (done) break;
						controller.enqueue(value);
					}
					controller.close();
				} catch (error) {
					controller.error(error);
				}
			},
		}).tee();
		return streams;
	}
}
