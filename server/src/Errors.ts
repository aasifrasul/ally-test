export class AuthError extends Error {
	constructor(
		message: string,
		public statusCode: number = 401,
		public code?: string,
	) {
		super(message);
		this.name = 'AuthError';
	}
}

export class TokenExpiredError extends AuthError {
	constructor() {
		super('Token has expired', 401, 'TOKEN_EXPIRED');
	}
}

export class InvalidTokenError extends AuthError {
	constructor() {
		super('Invalid token', 403, 'INVALID_TOKEN');
	}
}
