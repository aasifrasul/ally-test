/**
 * Represents the current state of a deferred promise
 */
const DeferredState = {
	PENDING: 'pending',
	RESOLVED: 'resolved',
	REJECTED: 'rejected',
} as const; // Using 'as const' for literal types

type DeferredState = (typeof DeferredState)[keyof typeof DeferredState];

export class Deferred<T> {
	private state: DeferredState;
	private value: T | null;
	private error: any; // Consider a more specific error type if known
	public createdAt: number;
	public promise: Promise<T>; // Publicly expose the promise

	// Private functions to resolve/reject the internal promise
	private _resolve!: (value: T | PromiseLike<T>) => void;
	private _reject!: (reason?: any) => void;

	// Public methods to resolve/reject the Deferred
	public resolve: (value: T | PromiseLike<T>) => void;
	public reject: (reason?: any) => void;

	constructor() {
		this.state = DeferredState.PENDING;
		this.value = null;
		this.error = null;
		this.createdAt = Date.now();

		this.promise = new Promise<T>((resolve, reject) => {
			this._resolve = (value) => {
				if (this.state === DeferredState.PENDING) {
					this.state = DeferredState.RESOLVED;
					this.value = value as T; // Type assertion
					resolve(value);
				}
			};

			this._reject = (error) => {
				if (this.state === DeferredState.PENDING) {
					this.state = DeferredState.REJECTED;
					this.error = error;
					reject(error);
				}
			};
		});

		// Bind methods to preserve context
		this.resolve = this._resolve.bind(this);
		this.reject = this._reject.bind(this);
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
	get result(): T | any | null {
		// Union type for value or error
		return this.isResolved ? this.value : this.error;
	}

	get getCreatedAt(): number {
		return this.createdAt;
	}

	/**
	 * Timeout the promise after specified milliseconds
	 */
	timeout(ms: number, message: string = 'Promise timed out'): this {
		setTimeout(() => {
			if (this.isPending) {
				this.reject(new Error(message));
			}
		}, ms);
		return this;
	}
}
