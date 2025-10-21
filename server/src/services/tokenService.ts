import jwt from 'jsonwebtoken';
import { JWT_SECRET, REFRESH_TOKEN_SECRET, JWT_EXPIRES_IN } from '../envConfigDetails';
import { InvalidTokenError, TokenExpiredError } from '../Error';
import { IUser, TokenPayload } from '../types';
import { convertExpiryToSeconds, createSessionId } from '../utils/tokenUtils';

export type TokenType = 'access' | 'refresh';

export const generateToken = (payload: TokenPayload, type: TokenType = 'access') => {
	const now = Math.floor(Date.now() / 1000);
	const sessionId = createSessionId();

	const tokenPayload = {
		...payload,
		type,
		sessionId,
		iat: now,
	};

	const secret = type === 'refresh' ? REFRESH_TOKEN_SECRET : JWT_SECRET;

	if (type === 'refresh' && !REFRESH_TOKEN_SECRET) {
		throw new Error('Missing REFRESH_TOKEN_SECRET for refresh tokens');
	}

	return jwt.sign(tokenPayload, secret, {
		expiresIn: type === 'access' ? convertExpiryToSeconds(JWT_EXPIRES_IN) : '7d',
		algorithm: 'HS256',
		issuer: 'ally-test',
		audience: 'ally-test-users',
	});
};

export const verifyToken = (token: string, type: TokenType = 'access'): TokenPayload => {
	try {
		const secret = type === 'refresh' ? REFRESH_TOKEN_SECRET : JWT_SECRET;

		const decoded = jwt.verify(token, secret, {
			algorithms: ['HS256'],
			issuer: 'ally-test',
			audience: 'ally-test-users',
		}) as TokenPayload;

		if (decoded.type !== type) throw new InvalidTokenError();
		return decoded;
	} catch (error) {
		if (error instanceof jwt.TokenExpiredError) throw new TokenExpiredError();
		if (error instanceof jwt.JsonWebTokenError) throw new InvalidTokenError();
		throw error;
	}
};

export const generateUserTokens = (user: IUser) => ({
	authToken: generateToken({ type: 'access', id: user.id!, email: user.email }),
	refreshToken: generateToken({ type: 'refresh', id: user.id!, email: user.email }),
});
