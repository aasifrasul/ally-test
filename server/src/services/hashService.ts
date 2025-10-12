import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Function to hash a plain password
export const hashPassword = async (plainPassword: string) => {
	// bcrypt.hash generates a hashed version of the password
	// The number 10 is the salt rounds, which affects the hashing complexity
	return await bcrypt.hash(plainPassword, 10);
};

// Function to compare a plain password with a hashed password
export const comparePassword = async (plainPassword: string, hashedPassword: string) => {
	// bcrypt.compare checks if the plain password matches the hashed one
	return await bcrypt.compare(plainPassword, hashedPassword);
};

// Generate secure session ID
export const generateSessionId = (): string => crypto.randomBytes(32).toString('hex');
