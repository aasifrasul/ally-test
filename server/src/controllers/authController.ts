import type { Request, Response } from 'express';

import { addUser, fetchUserByEmail, validateUserCredentials } from '../services/UserService';
import {
	generateToken,
	TOKEN_STORAGE_STRATEGIES,
	getClientType,
	setTokensResponse,
	verifyToken,
} from '../services/jwtService';

import { isCurrentEnvProd } from '../envConfigDetails';
import { AuthError } from '../Errors';
import { logger } from '../Logger';
import { IUser } from '../types';
import { hashPassword } from '../services/hashService';

// Register new user
export const register = async (req: Request, res: Response) => {
	try {
		const { name, email, age, password } = req.body;

		// Validation
		if (!email || !password) {
			res.status(400).json({ error: 'Email and password are required' });
			return;
		}

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			res.status(400).json({ error: 'Invalid email format' });
			return;
		}

		// Password strength validation
		if (password.length < 8) {
			res.status(400).json({ error: 'Password must be at least 8 characters' });
			return;
		}

		// Check existing user
		const existingUser = await fetchUserByEmail(email);
		if (existingUser) {
			res.status(409).json({ error: 'User already exists' });
			return;
		}

		const hashedPassword = await hashPassword(password);

		// Create user
		const newUser = {
			name,
			email,
			age,
			password: hashedPassword,
		} as IUser;

		const { user, success, message } = await addUser(newUser);

		if (!success || !user) {
			res.status(500).json({ error: message });
			return;
		}

		const payload = {
			id: user.id as string,
			email,
		};

		// Generate tokens
		const authToken = generateToken({
			type: 'access',
			...payload,
		});
		const refreshToken = generateToken({
			type: 'refresh',
			...payload,
		});

		// Determine client type and set tokens
		const clientType = getClientType(req);
		const responseData = setTokensResponse(res, { authToken, refreshToken }, clientType);

		// Add user info to response
		responseData.message = 'User created successfully';
		responseData.user = {
			id: newUser.id,
			email: newUser.email,
		};

		res.status(201).json(responseData);
	} catch (err) {
		// Handle errors gracefully
		res.status(500).json({ error: (err as unknown as Error).message });
	}
};

export const logout = async (req: Request, res: Response) => {
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

export const login = async (req: Request, res: Response) => {
	try {
		// Your login validation logic here
		const { email, password } = req.body;

		// Validate user credentials (placeholder)
		const user = await validateUserCredentials(email, password);
		if (!user) {
			throw new AuthError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
			return;
		}

		// Generate tokens
		const authToken = generateToken({
			type: 'access',
			id: user.id,
			email: user.email,
		});
		const refreshToken = generateToken({
			type: 'refresh',
			id: user.id,
			email: user.email,
		});

		// Determine client type and set tokens accordingly
		const clientType = getClientType(req);
		const responseData = setTokensResponse(res, { authToken, refreshToken }, clientType);

		// Add user info to response
		responseData.user = {
			id: user.id,
			email: user.email,
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

export const refreshToken = async (req: Request, res: Response) => {
	try {
		// Try to get refresh token from both sources
		const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

		if (!refreshToken) {
			throw new AuthError('Refresh token required', 401, 'NO_REFRESH_TOKEN');
		}

		const decoded = verifyToken(refreshToken, 'refresh');

		// Generate new tokens
		const payload = {
			id: decoded.id,
			email: decoded.email,
			role: decoded.role,
			permissions: decoded.permissions,
		};

		// Generate tokens
		const authToken = generateToken({
			type: 'access',
			...payload,
		});
		const newRefreshToken = generateToken({
			type: 'refresh',
			...payload,
		});

		// Determine storage strategy
		const clientType = getClientType(req);
		const responseData = setTokensResponse(
			res,
			{ authToken, refreshToken: newRefreshToken },
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
