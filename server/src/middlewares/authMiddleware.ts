import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

import { AuthError, InvalidTokenError, TokenExpiredError } from '../Errors';
import { logger } from '../Logger';
import {
	isCurrentEnvProd,
	JWT_SECRET,
	JWT_EXPIRES_IN,
	REFRESH_TOKEN_SECRET,
} from '../envConfigDetails';

export interface AuthenticatedRequest extends Request {
	user?: {
		id: string;
		email: string;
		role?: string;
		permissions?: string[];
		sessionId?: string;
		iat?: number;
		exp?: number;
	};
}

interface TokenPayload {
	id: string;
	email: string;
	role?: string;
	permissions?: string[];
	sessionId?: string;
	type: 'access' | 'refresh';
	iat?: number;
	exp?: number;
}

// Token storage strategy configuration
interface TokenStorageConfig {
	accessToken: 'cookie' | 'response' | 'both';
	refreshToken: 'cookie' | 'response' | 'both';
}

// Different storage strategies for different client types
const TOKEN_STORAGE_STRATEGIES = {
	// Web browsers with cookie support (most secure)
	web: {
		accessToken: 'cookie',
		refreshToken: 'cookie',
	} as TokenStorageConfig,

	// Mobile apps or SPAs that prefer localStorage (less secure but more flexible)
	mobile: {
		accessToken: 'response',
		refreshToken: 'response',
	} as TokenStorageConfig,

	// Server-to-server communication
	api: {
		accessToken: 'response',
		refreshToken: 'response',
	} as TokenStorageConfig,
};

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

// Generate secure session ID
const generateSessionId = (): string => crypto.randomBytes(32).toString('hex');

// Enhanced token generation with more security
export const generateTokens = (payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>) => {
	const now = Math.floor(Date.now() / 1000);
	const sessionId = generateSessionId();

	const accessTokenPayload: TokenPayload = {
		...payload,
		sessionId,
		type: 'access',
		iat: now,
	};

	const refreshTokenPayload: TokenPayload = {
		...accessTokenPayload,
		type: 'refresh',
	};

	const accessToken = jwt.sign(accessTokenPayload, JWT_SECRET, {
		expiresIn: JWT_EXPIRES_IN,
		algorithm: 'HS256',
		issuer: 'your-app-name',
		audience: 'your-app-users',
	});

	const refreshToken = jwt.sign(refreshTokenPayload, REFRESH_TOKEN_SECRET || JWT_SECRET, {
		expiresIn: '7d',
		algorithm: 'HS256',
		issuer: 'your-app-name',
		audience: 'your-app-users',
	});

	return { accessToken, refreshToken, sessionId };
};

// Enhanced token verification
export const verifyToken = (
	token: string,
	type: 'access' | 'refresh' = 'access',
): TokenPayload => {
	try {
		const secret = type === 'refresh' ? REFRESH_TOKEN_SECRET || JWT_SECRET : JWT_SECRET;
		const decoded = jwt.verify(token, secret, {
			algorithms: ['HS256'],
			issuer: 'your-app-name',
			audience: 'your-app-users',
		}) as TokenPayload;

		if (decoded.type !== type) {
			throw new InvalidTokenError();
		}

		return decoded;
	} catch (error) {
		if (error instanceof jwt.TokenExpiredError) {
			throw new TokenExpiredError();
		}
		if (error instanceof jwt.JsonWebTokenError) {
			throw new InvalidTokenError();
		}
		throw error;
	}
};

// Determine client type from request
export const getClientType = (req: Request): keyof typeof TOKEN_STORAGE_STRATEGIES => {
	const userAgent = req.headers['user-agent']?.toLowerCase() || '';
	const clientType = req.headers['x-client-type'] as string;

	// Check explicit client type header
	if (
		clientType &&
		TOKEN_STORAGE_STRATEGIES[clientType as keyof typeof TOKEN_STORAGE_STRATEGIES]
	) {
		return clientType as keyof typeof TOKEN_STORAGE_STRATEGIES;
	}

	// Auto-detect based on User-Agent or other headers
	if (
		userAgent.includes('mobile') ||
		userAgent.includes('android') ||
		userAgent.includes('iphone')
	) {
		return 'mobile';
	}

	// Check if it's an API call (has API key header, specific content-type, etc.)
	if (
		req.headers['x-api-key'] ||
		req.headers['content-type']?.includes('application/json')
	) {
		const acceptsHtml = req.headers.accept?.includes('text/html');
		if (!acceptsHtml) {
			return 'api';
		}
	}

	// Default to web for browsers
	return 'web';
};

export const setTokensResponse = (
	res: Response,
	tokens: { accessToken: string; refreshToken: string },
	clientType: keyof typeof TOKEN_STORAGE_STRATEGIES,
) => {
	const strategy = TOKEN_STORAGE_STRATEGIES[clientType];
	const responseData: any = { success: true };

	// Handle access token storage
	if (strategy.accessToken === 'cookie') {
		res.cookie('authToken', tokens.accessToken, {
			httpOnly: true,
			secure: isCurrentEnvProd,
			sameSite: 'strict',
			maxAge: 15 * 60 * 1000, // 15 minutes
		});
	} else if (strategy.accessToken === 'response') {
		responseData.accessToken = tokens.accessToken;
	}

	// Handle refresh token storage
	if (strategy.refreshToken === 'cookie') {
		res.cookie('refreshToken', tokens.refreshToken, {
			httpOnly: true,
			secure: isCurrentEnvProd,
			sameSite: 'strict',
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			path: '/auth', // Restrict refresh token cookie to auth endpoints only
		});
	} else if (strategy.refreshToken === 'response') {
		responseData.refreshToken = tokens.refreshToken;
	}

	return responseData;
};

// Enhanced token fetching with validation
const fetchToken = (
	req: AuthenticatedRequest,
): { token: string | null; source: 'header' | 'cookie' } => {
	// Priority: Authorization header > Cookie
	const authHeader = req.headers['authorization'];
	if (authHeader && authHeader.startsWith('Bearer ')) {
		const token = authHeader.substring(7);
		if (token && token !== 'null' && token !== 'undefined') {
			return { token, source: 'header' };
		}
	}

	// Fallback to cookie
	const cookieToken = req.cookies?.authToken;
	if (cookieToken && cookieToken !== 'null' && cookieToken !== 'undefined') {
		return { token: cookieToken, source: 'cookie' };
	}

	return { token: null, source: 'header' };
};

// Enhanced authentication middleware
export const authenticateToken = (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
) => {
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
		const maxTokenAge = 24 * 60 * 60; // 24 hours
		if (tokenAge > maxTokenAge) {
			throw new TokenExpiredError();
		}

		req.user = decoded;
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

// Enhanced optional authentication
export const optionalAuth = (req: AuthenticatedRequest, _: Response, next: NextFunction) => {
	try {
		const { token } = fetchToken(req);

		if (token) {
			const decoded = verifyToken(token, 'access');
			if (decoded.id && decoded.email) {
				req.user = decoded;
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

export const loginMiddleware = async (req: Request, res: Response) => {
	try {
		// Your login validation logic here
		const { email, password } = req.body;

		// Validate user credentials (placeholder)
		const user = await validateUserCredentials(email, password);
		if (!user) {
			throw new AuthError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
		}

		// Generate tokens
		const { accessToken, refreshToken } = generateTokens({
			id: user.id,
			email: user.email,
			role: user.role,
			permissions: user.permissions,
		});

		// Determine client type and set tokens accordingly
		const clientType = getClientType(req);
		const responseData = setTokensResponse(res, { accessToken, refreshToken }, clientType);

		// Add user info to response
		responseData.user = {
			id: user.id,
			email: user.email,
			role: user.role,
		};

		// Add storage strategy info for client debugging
		if (!isCurrentEnvProd) {
			responseData.storageStrategy = TOKEN_STORAGE_STRATEGIES[clientType];
		}

		res.json(responseData);
	} catch (error) {
		if (error instanceof AuthError) {
			res.status(error.statusCode).json({
				error: error.message,
				code: error.code,
			});
		}

		logger.error('Login error:', error);
		res.status(500).json({
			error: 'Internal server error',
			code: 'LOGIN_INTERNAL_ERROR',
		});
	}
};

export const refreshTokenMiddleware = async (req: Request, res: Response) => {
	try {
		// Try to get refresh token from both sources
		const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

		if (!refreshToken) {
			throw new AuthError('Refresh token required', 401, 'NO_REFRESH_TOKEN');
		}

		const decoded = verifyToken(refreshToken, 'refresh');

		// Generate new tokens
		const { accessToken, refreshToken: newRefreshToken } = generateTokens({
			id: decoded.id,
			email: decoded.email,
			role: decoded.role,
			permissions: decoded.permissions,
		});

		// Determine storage strategy
		const clientType = getClientType(req);
		const responseData = setTokensResponse(
			res,
			{ accessToken, refreshToken: newRefreshToken },
			clientType,
		);

		res.json(responseData);
	} catch (error) {
		if (error instanceof AuthError) {
			res.status(error.statusCode).json({
				error: error.message,
				code: error.code,
			});
		}

		logger.error('Token refresh error:', error);
		res.status(500).json({
			error: 'Internal server error',
			code: 'REFRESH_INTERNAL_ERROR',
		});
	}
};

// CORRECTED: Logout middleware
export const logoutMiddleware = async (req: AuthenticatedRequest, res: Response) => {
	try {
		// Clear cookies regardless of storage strategy (defensive approach)
		res.clearCookie('authToken');
		res.clearCookie('refreshToken', { path: '/auth' });

		res.json({
			success: true,
			message: 'Logged out successfully',
		});
	} catch (error) {
		logger.error('Logout error:', error);
		res.status(500).json({
			error: 'Logout failed',
			code: 'LOGOUT_ERROR',
		});
	}
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
	return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		if (!req.user) {
			res.status(401).json({
				error: 'Access denied. Authentication required.',
				code: 'AUTH_REQUIRED',
			});
			return;
		}

		if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role || '')) {
			res.status(403).json({
				error: 'Access denied. Insufficient role permissions.',
				code: 'INSUFFICIENT_ROLE',
				required: allowedRoles,
				current: req.user.role,
			});
		}

		next();
	};
};

// Permission-based authorization
export const authorizePermission = (...requiredPermissions: string[]) => {
	return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		if (!req.user) {
			res.status(401).json({
				error: 'Access denied. Authentication required.',
				code: 'AUTH_REQUIRED',
			});
			return;
		}

		const userPermissions = req.user.permissions || [];
		const hasPermission = requiredPermissions.every((permission) =>
			userPermissions.includes(permission),
		);

		if (!hasPermission) {
			res.status(403).json({
				error: 'Access denied. Insufficient permissions.',
				code: 'INSUFFICIENT_PERMISSIONS',
				required: requiredPermissions,
				current: userPermissions,
			});
		}

		next();
	};
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

export const getCurrentUser = (req: AuthenticatedRequest) => {
	return req.user
		? {
				id: req.user.id,
				email: req.user.email,
				role: req.user.role,
				permissions: req.user.permissions || [],
			}
		: null;
};

// Placeholder for user validation (implement according to your auth system)
async function validateUserCredentials(email: string, password: string) {
	// Your user validation logic here
	// This is just a placeholder
	return {
		id: '123',
		email,
		role: 'user',
		permissions: ['read:profile'],
	};
}
