import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

import { fetchToken, verifyToken } from '../services/jwtService';

import { AuthError, InvalidTokenError, TokenExpiredError } from '../Errors';
import { logger } from '../Logger';
import { isCurrentEnvProd } from '../envConfigDetails';

// Rate limiting for auth endpoints
export const authRateLimit = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 5, // 5 attempts per window
	message: {
		error: 'Too many authentication attempts, please try again later.',
	},
	standardHeaders: true,
	legacyHeaders: false,
});

// Enhanced optional authentication
export const optionalAuth = (req: Request, _: Response, next: NextFunction) => {
	try {
		const { token } = fetchToken(req);

		if (token) {
			const decoded = verifyToken(token, 'access');
			if (decoded.id && decoded.email) {
				//req.user = decoded;
			}
		}
	} catch (error) {
		logger.log(
			'Optional auth failed:',
			error instanceof AuthError ? error.message : 'Unknown error',
		);
	}

	next();
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
	res.removeHeader('X-Powered-By');
	res.setHeader('X-Content-Type-Options', 'nosniff');
	res.setHeader('X-Frame-Options', 'DENY');
	res.setHeader('X-XSS-Protection', '1; mode=block');
	res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

	if (isCurrentEnvProd) {
		res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
	}

	next();
};

// Role-based authorization
export const authorizeRole = (...allowedRoles: string[]) => {
	return (req: Request, res: Response, next: NextFunction) => {
		/*if (!req.user) {
			res.status(401).json({
				error: 'Access denied. Authentication required.',
				code: 'AUTH_REQUIRED',
			});
			return;
		}*/

		next();
	};
};

// Permission-based authorization
export const authorizePermission = (...requiredPermissions: string[]) => {
	return (req: Request, res: Response, next: NextFunction) => {
		/*if (!req.user) {
			res.status(401).json({
				error: 'Access denied. Authentication required.',
				code: 'AUTH_REQUIRED',
			});
			return;
		}*/

		next();
	};
};

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
	try {
		const { token } = fetchToken(req);

		if (!token) {
			throw new AuthError('Access denied. No token provided.', 401, 'NO_TOKEN');
		}

		const decoded = verifyToken(token, 'access');

		if (!decoded.id || !decoded.email) {
			throw new InvalidTokenError();
		}

		// Check if token is not too old
		const tokenAge = Math.floor(Date.now() / 1000) - (decoded.iat || 0);
		const maxTokenAge = 15 * 60; // 16 mins
		if (tokenAge > maxTokenAge) {
			throw new TokenExpiredError();
		}

		//req.user = decoded;
		next();
	} catch (error) {
		if (error instanceof AuthError) {
			res.status(error.statusCode).json({
				error: error.message,
				code: error.code,
			});
		}

		logger.error('Authentication error:', error);
		res.status(500).json({
			error: 'Internal authentication error',
			code: 'AUTH_INTERNAL_ERROR',
		});
	}
};

// Utility functions
export const createProtectedRoute = (
	requiredRoles?: string[],
	requiredPermissions?: string[],
) => {
	const middlewares = [authenticateToken];

	if (requiredRoles && requiredRoles.length > 0) {
		middlewares.push(authorizeRole(...requiredRoles));
	}

	if (requiredPermissions && requiredPermissions.length > 0) {
		middlewares.push(authorizePermission(...requiredPermissions));
	}

	return middlewares;
};
