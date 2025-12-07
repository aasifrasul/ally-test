import { comparePassword, hashPassword } from './hashService';
import { IUser, UserResult } from '../types';
import { userRepo } from '../DAL/userRepo';
import { DatabaseConflictError } from '../Error';
import { logger } from '../Logger';
import { isValidEmail, stripPassword, validateUserInput } from '../utils/validationUtils';
import { constants } from '../constants';
import { getDBInstance } from '../dbClients/helper';

// -------------------------------
// Constants & Types
// -------------------------------
const DEFAULT_PAGE_LIMIT = 10;
const DEFAULT_PAGE_OFFSET = 0;
const ALLOWED_UPDATE_FIELDS = new Set(['name', 'email', 'age']);

// Define a clearer type for generic operation results
export type OperationResult = { success: boolean; message?: string };

const { currentDB } = constants.dbLayer;

// -------------------------------
// Service Methods
// -------------------------------

export async function validateUserCredentials(
	email: string,
	password: string,
): Promise<UserResult> {
	if (!email || !password)
		return { success: false, message: 'Email and password are required' };

	const result = await fetchUserByEmail(email, true);

	if (!result.success || !result.user?.password)
		return { success: false, message: 'Invalid credentials' };

	const match = await comparePassword(password, result.user.password);

	if (!match) return { success: false, message: 'Passwords do not match' };

	return { success: true, user: stripPassword(result.user) as IUser };
}

export async function fetchUserByEmail(
	email: string,
	doNotStripPassword: boolean = false,
): Promise<UserResult> {
	if (!isValidEmail(email)) return { success: false, message: 'Invalid email' };

	try {
		const dbInstance = await getDBInstance(currentDB);
		const user: IUser | null = await dbInstance.findOne('users', { email });
		if (!user) return { success: false, message: 'User not found' };
		const cleanedUser = doNotStripPassword ? user : (stripPassword(user) as IUser);
		return { success: true, user: cleanedUser };
	} catch (err) {
		logger.error(`Fetch user by email failed: ${err}`);
		return { success: false, message: 'Database error' };
	}
}

export async function fetchUserById(id: string): Promise<UserResult> {
	if (!id) return { success: false, message: 'User ID is required' };

	try {
		const dbInstance = await getDBInstance(currentDB);
		const user: IUser | null = await dbInstance.findOne('users', { id });
		if (!user) return { success: false, message: 'User not found' };
		// Strip password before returning
		return { success: true, user: stripPassword(user) as IUser };
	} catch (err) {
		logger.error(`Fetch user by ID failed: ${err}`);
		return { success: false, message: 'Database error' };
	}
}

export async function addUser(user: IUser): Promise<UserResult> {
	const validation = validateUserInput(user);
	if (!validation.valid) return { success: false, message: validation.error };

	if (!user.name || !user.email || !user.password)
		return { success: false, message: 'Name, email, and password are required' };

	const hashedPassword = await hashPassword(user.password);
	const dbInstance = await getDBInstance(currentDB);

	try {
		const newUser: IUser | null = await dbInstance.insert('users', {
			...user,
			password: hashedPassword,
		} as IUser);

		if (!newUser) return { success: false, message: 'Failed to create User' };

		return { success: true, user: stripPassword(newUser) };
	} catch (err) {
		logger.error(`Add user failed: ${err}`);
		if (err instanceof DatabaseConflictError) {
			return { success: false, message: 'User with this email already exists' };
		}
		return { success: false, message: 'Database error' };
	}
}

export async function updateUser(id: string, updates: Partial<IUser>): Promise<UserResult> {
	if (!id) return { success: false, message: 'User ID is required' };

	// Input Sanitization and Filtering
	const filtered: Partial<IUser> = {};
	for (const [key, val] of Object.entries(updates)) {
		if (ALLOWED_UPDATE_FIELDS.has(key)) filtered[key as keyof IUser] = val;
	}
	if (Object.keys(filtered).length === 0)
		return { success: false, message: 'No valid fields to update' };

	const validation = validateUserInput(filtered);
	if (!validation.valid) return { success: false, message: validation.error };
	const dbInstance = await getDBInstance(currentDB);

	try {
		const modifiedCount: number = await dbInstance.update(`users`, id, filtered);
		if (modifiedCount <= 0) return { success: false, message: 'User not found' };
		return { success: true, user: stripPassword(updates as IUser) as IUser };
	} catch (err) {
		logger.error(`Update user failed: ${err}`);
		return { success: false, message: 'Database error' };
	}
}

export async function deleteUser(id: string): Promise<OperationResult> {
	if (!id) return { success: false, message: 'User ID is required' };

	try {
		const deleted = await userRepo.deleteById(id);
		if (!deleted) return { success: false, message: 'User not found' };
		return { success: true, message: 'User deleted successfully' };
	} catch (err) {
		logger.error(`Delete user failed: ${err}`);
		return { success: false, message: 'Database error' };
	}
}

export async function updateUserPassword(
	id: string,
	newPassword: string,
): Promise<UserResult> {
	if (!id) return { success: false, message: 'User ID is required' };
	if (!newPassword || newPassword.length < 8)
		return { success: false, message: 'Password must be at least 8 characters' };

	const hashed = await hashPassword(newPassword);

	try {
		const updated = await userRepo.updatePassword(id, hashed);
		if (!updated) return { success: false, message: 'User not found' };
		return {
			success: true,
			user: stripPassword(updated) as IUser,
			message: 'Password updated successfully',
		};
	} catch (err) {
		logger.error(`Update password failed: ${err}`);
		return { success: false, message: 'Database error' };
	}
}

// Adjusted return type to be clearer and align with typical service responses
type FetchAllUsersResult = {
	success: boolean;
	message?: string;
	users?: Omit<IUser, 'password'>[];
};

export async function fetchAllUsers(
	limit = DEFAULT_PAGE_LIMIT,
	offset = DEFAULT_PAGE_OFFSET,
): Promise<FetchAllUsersResult> {
	if (limit < 1 || limit > 100)
		return { success: false, message: 'Limit must be between 1 and 100' };
	if (offset < 0) return { success: false, message: 'Offset must be non-negative' };

	try {
		const users = await userRepo.findAll(limit, offset);
		// Passwords are already excluded in the repository's findAll methods
		return { success: true, users };
	} catch (err) {
		logger.error(`Fetch all users failed: ${err}`);
		return { success: false, message: 'Database error' };
	}
}

export async function userExists(email: string): Promise<OperationResult> {
	if (!isValidEmail(email)) return { success: false, message: 'Invalid email' };
	try {
		const user = await userRepo.findByEmail(email);
		return { success: !!user, message: user ? 'User exists' : 'User does not exist' };
	} catch (err) {
		logger.error(`User exists check failed: ${err}`);
		return { success: false, message: 'Database error' };
	}
}
