import { BaseQueue } from './BaseQueue';

interface QueueItem<T> {
	action: () => Promise<T>;
	resolve: (value: T | PromiseLike<T>) => void;
	reject: (reason?: any) => void;
}

export class AsyncQueue<T> extends BaseQueue<QueueItem<T>> {
	private pendingPromise: boolean = false;
	private isStopped: boolean = false;
	private isPaused: boolean = false;

	constructor() {
		super();
	}

	addToQueue(action: () => Promise<T>, autoDequeue: boolean = true): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			super.enqueue({ action, resolve, reject });
			if (autoDequeue) {
				this.processQueue().catch(reject);
			}
		});
	}

	async processQueue(): Promise<boolean> {
		if (this.pendingPromise || this.isPaused || this.isStopped) {
			if (this.isStopped) {
				this.reset();
				this.isStopped = false;
			}
			return false;
		}

		const item = super.dequeue();
		if (!item) return false;

		try {
			this.pendingPromise = true;
			const payload = await item.action();
			item.resolve(payload);
		} catch (e) {
			item.reject(e);
		} finally {
			this.pendingPromise = false;
			this.processQueue().catch(console.error);
		}

		return true;
	}

	stop(): void {
		this.isStopped = true;
	}

	pause(): void {
		this.isPaused = true;
	}

	async start(): Promise<boolean> {
		this.isStopped = false;
		this.isPaused = false;
		return this.processQueue();
	}
}
