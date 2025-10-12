import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import {
	authRateLimit,
	createProtectedRoute,
	authenticateToken,
} from '../middlewares/authMiddleware';
import { logout, register, refreshToken, login } from '../controllers/authController';
import { getClientType } from '../services/jwtService';

import { JWT_SECRET } from '../envConfigDetails';

const router = Router();

// Enhanced async handler with proper TypeScript typing
export const asyncHandler = (
	fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
};

// Mock user store (replace with your database)
const users: Array<{
	id: string;
	name: string;
	email: string;
	password: string;
	role: string;
	permissions?: string[];
}> = [];

async function storeOAuthTokens(userId: string, tokens: Record<string, string>) {
	// Store in database/redis - NEVER expose these to client
	// This is server-side only
	console.log(`Storing OAuth tokens for user ${userId}`);
	// await db.oauthTokens.create({ userId, ...tokens });
}

// Register endpoint
router.post('/register', authRateLimit, asyncHandler(register));

// Login endpoint
router.post('/login', authRateLimit, asyncHandler(login));

// Refresh token endpoint
router.post('/refresh', authRateLimit, asyncHandler(refreshToken));

// Logout endpoint
router.post('/logout', authRateLimit, authenticateToken, asyncHandler(logout));

// OAuth token exchange with proper storage strategy
router.post(
	'/oauth/token',
	asyncHandler(async (req: Request, res: Response) => {
		const { code } = req.body;
		const clientType = getClientType(req);

		try {
			// Exchange code with OAuth provider
			const result = await fetch('https://github.com/login/oauth/access_token', {
				method: 'POST',
				body: JSON.stringify({
					client_id: process.env.GITHUB_CLIENT_ID,
					client_secret: process.env.GITHUB_CLIENT_SECRET,
					code: code,
					redirect_uri: 'http://localhost:3000/callback',
				}),
				headers: { Accept: 'application/json' },
			});

			const tokenResponse = await result.json();

			const { access_token, refresh_token, token_type } = tokenResponse.data;

			// Fetch user info from OAuth provider
			const userResponse = await fetch('https://api.github.com/user', {
				headers: {
					Authorization: `${token_type} ${access_token}`,
					'User-Agent': 'MyApp/1.0',
				},
			});

			const { data: user } = await userResponse.json();

			// Create YOUR application's session token (this is different from OAuth tokens)
			const sessionPayload = {
				id: user.id,
				email: user.email,
				name: user.name,
				provider: 'github',
				providerId: user.id,
				iat: Math.floor(Date.now() / 1000),
			};

			const sessionToken = jwt.sign(sessionPayload, JWT_SECRET, {
				expiresIn: '1h',
				issuer: 'ally-test',
				audience: 'ally-test-users',
			});

			// Store OAuth tokens securely on server (database/redis)
			await storeOAuthTokens(user.id, {
				authToken: access_token,
				refreshToken: refresh_token,
				provider: 'github',
			});

			// Respond based on client type
			if (clientType === 'web') {
				// Web clients: Use secure httpOnly cookies
				res.cookie('session_token', sessionToken, {
					httpOnly: true,
					secure: process.env.NODE_ENV === 'production',
					sameSite: 'strict',
					maxAge: 3600000, // 1 hour
				});

				// DON'T expose OAuth tokens to browser
				res.json({
					success: true,
					user: {
						id: user.id,
						login: user.login,
						email: user.email,
						avatar_url: user.avatar_url,
					},
				});
			} else {
				// Mobile/API clients: Return session token (NOT OAuth tokens)
				res.json({
					success: true,
					authToken: sessionToken, // Your app's session token, not OAuth token
					user: {
						id: user.id,
						login: user.login,
						email: user.email,
						avatar_url: user.avatar_url,
					},
				});
			}
		} catch (error: any) {
			console.error('OAuth error:', error.response?.data || error.message);
			res.status(400).json({ error: 'OAuth authorization failed' });
		}
	}),
);

// Verify token endpoint (useful for clients to check if token is still valid)
router.get('/verify', authenticateToken, (_: Request, res: Response): void => {
	res.json({
		success: true,
		valid: true,
	});
});

// Basic protection
router.get('/profile', authenticateToken);

// Role-based protection
router.get('/admin', ...createProtectedRoute(['admin']), (req, res) => {
	res.status(200).json('Some  data');
});

// Permission-based protection
router.get('/users', ...createProtectedRoute([], ['read:users']), (req, res) => {
	res.status(200).json('Some  data');
});

// Combined protection
router.delete(
	'/users/:id',
	...createProtectedRoute(['admin'], ['delete:users']),
	(req, res) => {
		res.status(200).json('Some  data');
	},
);

export { router as authRoutes };
