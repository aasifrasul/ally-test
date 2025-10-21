import { BaseError } from './BaseError';

export class AuthError extends BaseError {
	constructor(message: string, statusCode = 401, code?: string, cause?: unknown) {
		super(message, { statusCode, code, cause });
	}
}

export class TokenExpiredError extends AuthError {
	constructor(cause?: unknown) {
		super('Token has expired', 401, 'TOKEN_EXPIRED', cause);
	}
}

export class InvalidTokenError extends AuthError {
	constructor(cause?: unknown) {
		super('Invalid token', 403, 'INVALID_TOKEN', cause);
	}
}

export class DatabaseConflictError extends BaseError {
	constructor(message = 'Duplicate key error', cause?: unknown) {
		super(message, { statusCode: 409, code: 'DB_CONFLICT', cause });
	}
}

export class DatabaseOperationError extends BaseError {
	constructor(message = 'Database operation failed', cause?: unknown) {
		super(message, { statusCode: 500, code: 'DB_OPERATION_FAILED', cause });
	}
}
