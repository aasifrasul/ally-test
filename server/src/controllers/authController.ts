import type { Request, Response } from 'express';

import { addUser, fetchUserByEmail, validateUserCredentials } from '../services/UserService';
import { generateUserTokens, verifyToken } from '../services/tokenService';
import { hashPassword } from '../services/hashService';
import { setTokensResponse, clearAuthCookies } from '../transport/tokenTransport';
import { isValidEmail } from '../utils/validationUtils';

import { AuthError } from '../Error';
import { logger } from '../Logger';
import { IUser } from '../types';

// Register new user
export const register = async (req: Request, res: Response) => {
	try {
		const { name, email, age, password } = req.body;
		if (!email || !password)
			return res.status(400).json({ error: 'Email and password are required' });

		if (!isValidEmail(email))
			return res.status(400).json({ error: 'Invalid email format' });

		if (password.length < 8)
			return res.status(400).json({ error: 'Password must be at least 8 characters' });

		const existing = await fetchUserByEmail(email);
		if (existing.success && existing.user)
			return res.status(409).json({ error: 'User already exists' });

		const hashedPassword = await hashPassword(password);
		const response = await addUser({
			name,
			email,
			age,
			password: hashedPassword,
		} as IUser);

		if (!response.success || !response.user?.id)
			return res.status(500).json({ error: response.message });

		const { authToken, refreshToken } = generateUserTokens(response.user);
		const responseData = setTokensResponse(req, res, { authToken, refreshToken });

		return res.status(201).json({
			...responseData,
			message: 'User created successfully',
			user: { id: response.user.id, email },
		});
	} catch (err) {
		logger.error('Registration error:', err);
		return res.status(500).json({ error: 'User registration failed' });
	}
};

export const login = async (req: Request, res: Response) => {
	try {
		const { email, password } = req.body;
		const response = await validateUserCredentials(email, password);

		if (!response.success || !response.user)
			throw new AuthError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

		const { authToken, refreshToken } = generateUserTokens(response.user);
		const responseData = setTokensResponse(req, res, { authToken, refreshToken });

		return res.json({
			...responseData,
			user: { id: response.user.id, email: response.user.email },
		});
	} catch (error) {
		if (error instanceof AuthError)
			return res
				.status(error.statusCode!)
				.json({ error: error.message, code: error.code });

		logger.error('Login error:', error);
		return res
			.status(500)
			.json({ error: 'Internal server error', code: 'LOGIN_INTERNAL_ERROR' });
	}
};

export const refreshToken = async (req: Request, res: Response) => {
	try {
		const oldRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
		if (!oldRefreshToken)
			throw new AuthError('Refresh token required', 401, 'NO_REFRESH_TOKEN');

		const decoded = verifyToken(oldRefreshToken, 'refresh');
		if (!decoded?.id)
			throw new AuthError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');

		const { authToken, refreshToken } = generateUserTokens({
			id: decoded.id,
			email: decoded.email,
		} as IUser);

		const responseData = setTokensResponse(req, res, { authToken, refreshToken });
		return res.json(responseData);
	} catch (error) {
		if (error instanceof AuthError)
			return res
				.status(error.statusCode!)
				.json({ error: error.message, code: error.code });

		logger.error('Token refresh error:', error);
		return res
			.status(500)
			.json({ error: 'Internal server error', code: 'REFRESH_INTERNAL_ERROR' });
	}
};

export const logout = async (_req: Request, res: Response) => {
	try {
		clearAuthCookies(res);
		return res.json({ success: true, message: 'Logged out successfully' });
	} catch (error) {
		logger.error('Logout error:', error);
		return res.status(500).json({ error: 'Logout failed', code: 'LOGOUT_ERROR' });
	}
};
