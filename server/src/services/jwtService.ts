import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import {
	isCurrentEnvProd,
	JWT_SECRET,
	JWT_EXPIRES_IN,
	REFRESH_TOKEN_SECRET,
} from '../envConfigDetails';
import { generateSessionId } from './hashService';

import { InvalidTokenError, TokenExpiredError } from '../Errors';
import { TokenPayload } from '../types';

import { logger } from '../Logger';

// Token storage strategy configuration
interface TokenStorageConfig {
	authToken: 'cookie' | 'response' | 'both';
	refreshToken: 'cookie' | 'response' | 'both';
}

// Different storage strategies for different client types
export const TOKEN_STORAGE_STRATEGIES: Record<string, TokenStorageConfig> = {
	// Web browsers with cookie support (most secure)
	web: {
		authToken: 'response',
		refreshToken: 'cookie',
	} as TokenStorageConfig,

	// Mobile apps or SPAs that prefer localStorage (less secure but more flexible)
	mobile: {
		authToken: 'response',
		refreshToken: 'response',
	} as TokenStorageConfig,

	// Server-to-server communication
	api: {
		authToken: 'response',
		refreshToken: 'response',
	} as TokenStorageConfig,
};

// Helper function to convert string expiry to seconds
const convertExpiryToSeconds = (expiry: string): number => {
	const match = expiry.match(/^(\d+)([smhd])$/);
	if (!match) return 900; // default 15 minutes

	const value = parseInt(match[1]);
	const unit = match[2];

	const multipliers: Record<string, number> = {
		s: 1,
		m: 60,
		h: 3600,
		d: 86400,
	};

	return value * (multipliers[unit] || 60);
};

// Enhanced token generation with more security
export const generateToken = (payload: TokenPayload) => {
	const now = Math.floor(Date.now() / 1000);
	const sessionId = generateSessionId();

	const tokenPayload = {
		...payload,
		sessionId,
		iat: now,
	};

	return jwt.sign(tokenPayload, JWT_SECRET, {
		expiresIn: payload.type === 'access' ? convertExpiryToSeconds(JWT_EXPIRES_IN) : '7d',
		algorithm: 'HS256',
		issuer: 'ally-test',
		audience: 'ally-test-users',
	});
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
			issuer: 'ally-test',
			audience: 'ally-test-users',
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
	tokens: { authToken: string; refreshToken: string },
	clientType: keyof typeof TOKEN_STORAGE_STRATEGIES,
) => {
	const strategy = TOKEN_STORAGE_STRATEGIES[clientType];
	const responseData: any = { success: true };

	// Handle access token storage
	if (strategy.authToken === 'cookie') {
		res.cookie('authToken', tokens.authToken, {
			httpOnly: true,
			secure: isCurrentEnvProd,
			sameSite: 'strict',
			maxAge: 15 * 60 * 1000, // 15 minutes
		});
	} else if (strategy.authToken === 'response') {
		responseData.authToken = tokens.authToken;
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

export const fetchToken = (
	req: Request,
): { token: string | null; source: 'header' | 'cookie' } => {
	// Priority: Authorization header > Cookie
	const authHeader = req.headers?.['authorization'];
	if (authHeader && authHeader.startsWith('Bearer ')) {
		const token = authHeader.substring(7);
		if (token && token !== 'null' && token !== 'undefined') {
			return { token, source: 'header' };
		}
	}

	// Fallback to cookie
	const cookieToken = req.cookies?.['authToken'];
	if (cookieToken && cookieToken !== 'null' && cookieToken !== 'undefined') {
		return { token: cookieToken, source: 'cookie' };
	}

	return { token: null, source: 'header' };
};
