import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import {
	generateTokens,
	authenticateToken,
	authRateLimit,
	AuthenticatedRequest,
	getClientType,
	setTokensResponse,
	createProtectedRoute,
} from '../middlewares/authMiddleware';

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
	email: string;
	password: string;
	role: string;
	permissions?: string[];
}> = [];

// Register endpoint
router.post(
	'/register',
	authRateLimit,
	asyncHandler(async (req: Request, res: Response) => {
		const { email, password, role = 'user' } = req.body;

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
		const existingUser = users.find((u) => u.email === email);
		if (existingUser) {
			res.status(409).json({ error: 'User already exists' });
			return;
		}

		// Hash password
		const saltRounds = 10;
		const hashedPassword = await bcrypt.hash(password, saltRounds);

		// Create user
		const newUser = {
			id: Date.now().toString(),
			email,
			password: hashedPassword,
			role,
			permissions: ['read:profile'],
		};
		users.push(newUser);

		// Generate tokens
		const { accessToken, refreshToken } = generateTokens({
			id: newUser.id,
			email: newUser.email,
			role: newUser.role,
			permissions: newUser.permissions,
		});

		// Determine client type and set tokens
		const clientType = getClientType(req);
		const responseData = setTokensResponse(res, { accessToken, refreshToken }, clientType);

		// Add user info to response
		responseData.message = 'User created successfully';
		responseData.user = {
			id: newUser.id,
			email: newUser.email,
			role: newUser.role,
		};

		res.status(201).json(responseData);
	}),
);

// Login endpoint
router.post(
	'/login',
	authRateLimit,
	asyncHandler(async (req: Request, res: Response) => {
		const { email, password } = req.body;

		// Validation
		if (!email || !password) {
			res.status(400).json({ error: 'Email and password are required' });
			return;
		}

		// Find user
		const user = users.find((u) => u.email === email);
		if (!user) {
			res.status(401).json({ error: 'Invalid credentials' });
			return;
		}

		// Verify password
		const isValidPassword = await bcrypt.compare(password, user.password);
		if (!isValidPassword) {
			res.status(401).json({ error: 'Invalid credentials' });
			return;
		}

		// Generate tokens
		const { accessToken, refreshToken } = generateTokens({
			id: user.id,
			email: user.email,
			role: user.role,
			permissions: user.permissions,
		});

		// Determine client type and set tokens
		const clientType = getClientType(req);
		const responseData = setTokensResponse(res, { accessToken, refreshToken }, clientType);

		// Add user info to response
		responseData.message = 'Login successful';
		responseData.user = {
			id: user.id,
			email: user.email,
			role: user.role,
		};

		res.json(responseData);
	}),
);

// Refresh token endpoint
router.post(
	'/refresh',
	asyncHandler(async (req: Request, res: Response) => {
		// Try to get refresh token from both sources
		const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

		if (!refreshToken) {
			res.status(401).json({ error: 'Refresh token required' });
			return;
		}

		try {
			// Verify refresh token (you'll need to import verifyToken from authMiddleware)
			// For now, using a simplified approach
			const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
				generateTokens({
					id: 'user-id', // Get from decoded token
					email: 'user@example.com', // Get from decoded token
					role: 'user',
				});

			const clientType = getClientType(req);
			const responseData = setTokensResponse(
				res,
				{ accessToken: newAccessToken, refreshToken: newRefreshToken },
				clientType,
			);

			res.json(responseData);
		} catch (error) {
			res.status(401).json({ error: 'Invalid refresh token' });
		}
	}),
);

// Logout endpoint
router.post('/logout', authenticateToken, (req: Request, res: Response): void => {
	// Clear cookies regardless of storage strategy
	res.clearCookie('authToken');
	res.clearCookie('refreshToken', { path: '/auth' });

	res.json({
		success: true,
		message: 'Logout successful',
	});
});

// Get current user
router.get('/me', authenticateToken, (req: Request, res: Response): void => {
	const authReq = req as AuthenticatedRequest;

	if (!authReq.user) {
		res.status(401).json({ error: 'Not authenticated' });
		return;
	}

	res.json({
		success: true,
		user: authReq.user,
	});
});

// Verify token endpoint (useful for clients to check if token is still valid)
router.get('/verify', authenticateToken, (req: Request, res: Response): void => {
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
