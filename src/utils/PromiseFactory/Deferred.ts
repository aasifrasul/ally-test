/**
 * Represents the current state of a deferred promise
 */
enum DeferredState {
	PENDING = 'pending',
	RESOLVED = 'resolved',
	REJECTED = 'rejected',
}

export class Deferred<T> {
	private state: DeferredState = DeferredState.PENDING;
	private value: T | null = null;
	private error: unknown = null;
	public createdAt: number = Date.now();
	public promise: Promise<T>; // Publicly expose the promise
	private timeoutId: NodeJS.Timeout | null = null;

	// Public methods to resolve/reject the Deferred
	public resolve!: (value: T | PromiseLike<T>) => void;
	public reject!: (reason?: any) => void;
	public settledAt: number = 0;

	constructor() {
		this.promise = new Promise<T>((resolve, reject) => {
			this.resolve = async (value) => {
				if (this.isSettled) return;
				this.state = DeferredState.RESOLVED;
				this.value = await Promise.resolve(value); // Handles PromiseLike
				this.settledAt = Date.now();
				this.cleanUp();
				resolve(value);
			};

			this.reject = (error) => {
				if (this.isSettled) return;
				this.state = DeferredState.REJECTED;
				this.error = error;
				this.cleanUp();
				reject(error);
			};
		});
	}

	/**
	 * Check if the promise is still pending
	 */
	get isPending(): boolean {
		return this.state === DeferredState.PENDING;
	}

	/**
	 * Check if the promise has been resolved
	 */
	get isResolved(): boolean {
		return this.state === DeferredState.RESOLVED;
	}

	/**
	 * Check if the promise has been rejected
	 */
	get isRejected(): boolean {
		return this.state === DeferredState.REJECTED;
	}

	/**
	 * Check if the promise has been settled (resolved or rejected)
	 */
	get isSettled(): boolean {
		return this.state !== DeferredState.PENDING;
	}

	/**
	 * Get the current value (if resolved) or error (if rejected)
	 */
	get result(): T | unknown | null {
		// Union type for value or error
		return this.isResolved ? this.value : this.error;
	}

	/**
	 * Timeout the promise after specified milliseconds
	 */
	timeout(ms: number, message: string = 'Promise timed out'): this {
		this.timeoutId = setTimeout(() => {
			if (this.isPending) this.reject(new Error(message));
		}, ms);
		return this;
	}

	private cleanUp() {
		if (this.timeoutId) {
			clearTimeout(this.timeoutId);
		}
	}

	reset(): void {
		if (!this.isSettled) {
			throw new Error('Cannot reset pending promise');
		}
		this.cleanUp();
		// Reset state...
	}
}
