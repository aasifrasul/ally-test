import type { Request, Response } from 'express';
import { BaseError } from '../Error/BaseError';
import { logger } from '../Logger';

export function errorHandler(err: unknown, req: Request, res: Response) {
	// Handle our custom errors
	if (err instanceof BaseError) {
		logger.error({
			name: err.name,
			message: err.message,
			code: err.code,
			statusCode: err.statusCode,
			path: req.path,
			method: req.method,
			context: err.context,
			cause:
				err.cause instanceof Error
					? { name: err.cause.name, message: err.cause.message }
					: err.cause,
		});

		return res.status(err.statusCode ?? 500).json({
			error: {
				name: err.name,
				message: err.message,
				code: err.code,
				statusCode: err.statusCode ?? 500,
			},
		});
	}

	// Handle generic or unexpected errors
	if (err instanceof Error) {
		logger.error({
			name: err.name,
			message: err.message,
			stack: err.stack,
			path: req.path,
			method: req.method,
		});

		return res.status(500).json({
			error: {
				name: err.name,
				message: 'Internal server error',
				code: 'INTERNAL_ERROR',
			},
		});
	}

	// Handle non-error values (rare)
	logger.error({
		message: 'Unknown error type',
		error: err,
		path: req.path,
		method: req.method,
	});

	return res.status(500).json({
		error: {
			name: 'UnknownError',
			message: 'An unknown error occurred',
			code: 'UNKNOWN_ERROR',
		},
	});
}
