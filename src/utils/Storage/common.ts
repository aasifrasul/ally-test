// Custom error types for better error handling
export class StorageError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'StorageError';
	}
}

export class StorageInitializationError extends StorageError {
	constructor(message: string) {
		super(message);
		this.name = 'StorageInitializationError';
	}
}
