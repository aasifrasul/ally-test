import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { generateToken, authenticateToken } from '../middlewares/authMiddleware';

import { isCurrentEnvProd } from '../envConfigDetails';

const router = Router();

// This is a simple wrapper function for async route handlers.
// It catches any errors and passes them to the Express error handler.
export const asyncHandler =
	(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
	(req: Request, res: Response, next: NextFunction) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};

// Mock user store (replace with your database)
const users = [
	{
		id: '1',
		email: 'user@example.com',
		password: '$2b$10$hash', // hashed password
		role: 'user',
	},
];

// Register endpoint
router.post(
	'/register',
	asyncHandler(async (req: Request, res: Response) => {
		const { email, password, role = 'user' } = req.body;

		if (!email || !password) {
			return res.status(400).json({ error: 'Email and password are required' });
		}

		const existingUser = users.find((u) => u.email === email);
		if (existingUser) {
			return res.status(409).json({ error: 'User already exists' });
		}

		const saltRounds = 10;
		const hashedPassword = await bcrypt.hash(password, saltRounds);

		const newUser = {
			id: Date.now().toString(),
			email,
			password: hashedPassword,
			role,
		};
		users.push(newUser);

		const token = generateToken({
			id: newUser.id,
			email: newUser.email,
			role: newUser.role,
		});

		res.cookie('authToken', token, {
			httpOnly: true,
			secure: isCurrentEnvProd,
			sameSite: 'strict',
			maxAge: 24 * 60 * 60 * 1000, // 24 hours
		});

		res.status(201).json({
			message: 'User created successfully',
			token,
			user: { id: newUser.id, email: newUser.email, role: newUser.role },
		});
	}),
);

// Login endpoint
router.post(
	'/login',
	asyncHandler(async (req: Request, res: Response) => {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({ error: 'Email and password are required' });
		}

		const user = users.find((u) => u.email === email);
		if (!user) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		const isValidPassword = await bcrypt.compare(password, user.password);
		if (!isValidPassword) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		const token = generateToken({ id: user.id, email: user.email, role: user.role });

		res.cookie('authToken', token, {
			httpOnly: true,
			secure: isCurrentEnvProd,
			sameSite: 'strict',
			maxAge: 24 * 60 * 60 * 1000, // 24 hours
		});

		res.json({
			message: 'Login successful',
			token,
			user: { id: user.id, email: user.email, role: user.role },
		});
	}),
);

// Logout endpoint
router.post('/logout', (req: Request, res: Response) => {
	res.clearCookie('authToken');
	res.json({ message: 'Logout successful' });
});

// Get current user
router.get('/me', authenticateToken, (req: any, res: Response) => {
	res.json({ user: req.user });
});

export { router as authRoutes };
