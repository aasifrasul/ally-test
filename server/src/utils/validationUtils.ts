import { IUser } from '../types';

// -------------------------------
export const stripPassword = (user: IUser): Omit<IUser, 'password'> => {
	// Better way to strip: use destructuring and Omit type for correctness
	const { password, ...rest } = user;
	return rest as IUser;
};

export const isValidEmail = (email: string): boolean =>
	/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const validateUserInput = (
	user: Partial<IUser>,
): { valid: boolean; error?: string } => {
	if (user.email && !isValidEmail(user.email))
		return { valid: false, error: 'Invalid email format' };
	if (user.age !== undefined && (user.age < 0 || user.age > 150))
		return { valid: false, error: 'Invalid age' };
	if (user.password && user.password.length < 8)
		return { valid: false, error: 'Password must be at least 8 characters' };
	return { valid: true };
};
