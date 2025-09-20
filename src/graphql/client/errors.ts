export class GraphQLTimeoutError extends Error {
	constructor(timeoutMs: number) {
		super(`GraphQL request timed out after ${timeoutMs}ms`);
		this.name = 'GraphQLTimeoutError';
	}
}

export class GraphQLNetworkError extends Error {
	constructor(
		message: string,
		public originalError?: Error,
	) {
		super(`Network error: ${message}`);
		this.name = 'GraphQLNetworkError';
	}
}

export class GraphQLValidationError extends Error {
	constructor(errors: string[]) {
		super(`GraphQL validation errors: ${errors.join(', ')}`);
		this.name = 'GraphQLValidationError';
	}
}

export class GraphQLSubscriptionError extends Error {
	constructor(
		message: string,
		public retryCount: number = 0,
	) {
		super(`Subscription error: ${message} (retries: ${retryCount})`);
		this.name = 'GraphQLSubscriptionError';
	}
}

export class GraphQLConnectionError extends Error {
	constructor(message: string) {
		super(`Connection error: ${message}`);
		this.name = 'GraphQLConnectionError';
	}
}
