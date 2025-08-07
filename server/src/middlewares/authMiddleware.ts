import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

import { JWT_SECRET, JWT_EXPIRES_IN } from '../envConfigDetails';

interface AuthenticatedRequest extends Request {
	user?: {
		id: string;
		email: string;
		role?: string;
	};
}

// Generate JWT token
export const generateToken = (payload: { id: string; email: string; role?: string }) => {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
};

// Verify JWT token
export const verifyToken = (token: string) => {
	return jwt.verify(token, JWT_SECRET);
};

// Authentication middleware
export const authenticateToken = (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
) => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

	const cookieToken = req.cookies?.authToken;
	const finalToken = token || cookieToken;

	if (!finalToken) {
		res.status(401).json({
			error: 'Access denied. No token provided.',
		});
		return; // Add a return here to stop execution
	}

	try {
		const decoded = verifyToken(finalToken) as any;
		req.user = decoded;
		next();
	} catch (error) {
		res.status(403).json({
			error: 'Invalid token.',
		});
		return; // Add a return here to stop execution
	}
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];
	const cookieToken = req.cookies?.authToken;
	const finalToken = token || cookieToken;

	if (finalToken) {
		try {
			const decoded = verifyToken(finalToken) as any;
			req.user = decoded;
		} catch (error) {
			// Token invalid, but continue without user
		}
	}
	next();
};

// Role-based authorization
export const authorizeRole = (...roles: string[]) => {
	return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		if (!req.user) {
			res.status(401).json({ error: 'Access denied. Authentication required.' });
			return;
		}

		if (roles.length && !roles.includes(req.user.role || '')) {
			res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
			return;
		}

		next();
	};
};
