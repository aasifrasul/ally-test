export interface ErrorOptions {
	cause?: unknown;
	code?: string;
	statusCode?: number;
	context?: Record<string, any>;
}

export class BaseError extends Error {
	public readonly code?: string;
	public readonly statusCode?: number;
	public readonly cause?: unknown;
	public readonly context?: Record<string, any>;

	constructor(message: string, options: ErrorOptions = {}) {
		super(`${message} - ${options.cause}`);
		this.name = new.target.name;
		this.code = options.code;
		this.statusCode = options.statusCode;
		this.cause = options.cause;
		this.context = options.context;

		// Preserve stack trace (important for subclasses)
		Error.captureStackTrace?.(this, new.target);
	}
}
