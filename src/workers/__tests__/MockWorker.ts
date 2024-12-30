type EventListenerMap = Map<string, Set<EventListenerOrEventListenerObject>>;

export class MockWorker implements Worker {
	private listeners: EventListenerMap = new Map();
	private mockResponses: Map<string, (data: any) => any> = new Map();
	private messageQueue: Array<{ type: string; data: any }> = [];
	private processingDelay: number = 0;
	private terminated: boolean = false;

	// Worker interface properties
	public onmessage: ((this: Worker, ev: MessageEvent) => any) | null = null;
	public onerror: ((this: AbstractWorker, ev: ErrorEvent) => any) | null = null;
	public onmessageerror: ((this: Worker, ev: MessageEvent) => any) | null = null;

	constructor(options: { processingDelay?: number } = {}) {
		this.processingDelay = options.processingDelay || 0;
	}

	// Mock configuration methods
	public mockResponse(type: string, handler: (data: any) => any): void {
		this.mockResponses.set(type, handler);
	}

	public setProcessingDelay(delay: number): void {
		this.processingDelay = delay;
	}

	public clearMocks(): void {
		this.mockResponses.clear();
	}

	// Worker interface methods
	public postMessage(
		message: any,
		transfer?: StructuredSerializeOptions | Transferable[],
	): void {
		if (this.terminated) {
			throw new Error('Worker has been terminated');
		}

		const { type, data } = message;

		// Schedule the mock response
		setTimeout(async () => {
			try {
				const mockHandler = this.mockResponses.get(type);

				if (!mockHandler) {
					this.dispatchError(new Error(`No mock handler for message type: ${type}`));
					return;
				}

				const response = await mockHandler(data);

				const messageEvent = new MessageEvent('message', {
					data: response,
					lastEventId: '',
					origin: '',
					ports: [],
					source: null,
				});

				// Dispatch to onmessage handler if exists
				if (this.onmessage) {
					this.onmessage.call(this, messageEvent);
				}

				// Dispatch to event listeners
				this.dispatchEvent(messageEvent);
			} catch (error) {
				if (error instanceof Error) {
					this.dispatchError(error);
				} else {
					this.dispatchError(new Error(String(error)));
				}
			}
		}, this.processingDelay);
	}

	public terminate(): void {
		this.terminated = true;
		this.listeners.clear();
		this.mockResponses.clear();
		this.messageQueue = [];
		this.onmessage = null;
		this.onerror = null;
		this.onmessageerror = null;
	}

	public addEventListener(
		type: string,
		listener: EventListenerOrEventListenerObject,
		options?: boolean | AddEventListenerOptions,
	): void {
		if (!this.listeners.has(type)) {
			this.listeners.set(type, new Set());
		}
		this.listeners.get(type)?.add(listener);
	}

	public removeEventListener(
		type: string,
		listener: EventListenerOrEventListenerObject,
		options?: boolean | EventListenerOptions,
	): void {
		this.listeners.get(type)?.delete(listener);
		if (this.listeners.get(type)?.size === 0) {
			this.listeners.delete(type);
		}
	}

	public dispatchEvent(event: Event): boolean {
		if (this.terminated) {
			return false;
		}

		const listeners = this.listeners.get(event.type);
		if (listeners) {
			listeners.forEach((listener) => {
				if (typeof listener === 'function') {
					listener.call(this, event);
				} else {
					listener.handleEvent(event);
				}
			});
		}
		return true;
	}

	// Private helper methods
	private dispatchError(error: Error): void {
		const errorEvent = new ErrorEvent('error', {
			error,
			message: error.message,
			filename: 'mock-worker',
			lineno: 0,
			colno: 0,
		});

		if (this.onerror) {
			this.onerror.call(this, errorEvent);
		}

		this.dispatchEvent(errorEvent);
	}
}
