import { Request, Response } from 'express';
import { isCurrentEnvProd } from '../envConfigDetails';
import { getClientType } from '../utils/tokenUtils';

interface TokenStorageConfig {
	authToken: 'cookie' | 'response' | 'both';
	refreshToken: 'cookie' | 'response' | 'both';
}

export const TOKEN_STORAGE_STRATEGIES: Record<string, TokenStorageConfig> = {
	web: { authToken: 'response', refreshToken: 'cookie' },
	mobile: { authToken: 'response', refreshToken: 'response' },
	api: { authToken: 'response', refreshToken: 'response' },
};

interface TokenResponse {
	success: boolean;
	authToken?: string;
	refreshToken?: string;
}

export const setTokensResponse = (
	req: Request,
	res: Response,
	tokens: { authToken: string; refreshToken: string },
): TokenResponse => {
	const clientType = getClientType(req);
	const strategy = TOKEN_STORAGE_STRATEGIES[clientType];
	const responseData: TokenResponse = { success: true };

	if (strategy.authToken === 'cookie' || strategy.authToken === 'both') {
		res.cookie('authToken', tokens.authToken, {
			httpOnly: true,
			secure: isCurrentEnvProd,
			sameSite: 'strict',
			maxAge: 15 * 60 * 1000, // 15 minutes
		});
	}
	if (strategy.authToken === 'response' || strategy.authToken === 'both') {
		responseData.authToken = tokens.authToken;
	}

	if (strategy.refreshToken === 'cookie' || strategy.refreshToken === 'both') {
		res.cookie('refreshToken', tokens.refreshToken, {
			httpOnly: true,
			secure: isCurrentEnvProd,
			sameSite: 'strict',
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			path: '/auth',
		});
	}
	if (strategy.refreshToken === 'response' || strategy.refreshToken === 'both') {
		responseData.refreshToken = tokens.refreshToken;
	}

	return responseData;
};

export const fetchToken = (
	req: Request,
): { token: string | null; source: 'header' | 'cookie' } => {
	const authHeader = req.headers?.['authorization'];
	if (authHeader?.startsWith('Bearer ')) {
		const token = authHeader.substring(7);
		if (token && token !== 'null' && token !== 'undefined') {
			return { token, source: 'header' };
		}
	}

	const cookieToken = req.cookies?.['authToken'];
	if (cookieToken && cookieToken !== 'null' && cookieToken !== 'undefined') {
		return { token: cookieToken, source: 'cookie' };
	}

	return { token: null, source: 'header' };
};

export const clearAuthCookies = (res: Response) => {
	res.clearCookie('authToken');
	res.clearCookie('refreshToken', { path: '/auth' });
};
