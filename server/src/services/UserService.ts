import { constants } from '../constants';
import { executeQuery } from '../dbClients/helper';
import { User } from '../models';

import { DBType, IUser, UserResult } from '../types';
import { logger } from '../Logger';
import { comparePassword } from './hashService';

// Placeholder for user validation (implement according to your auth system)
export async function validateUserCredentials(email: string, password: string) {
	const user = await fetchUserByEmail(email);
	const isPasswordMatch = comparePassword(password, user.password);
	if (!isPasswordMatch) {
		logger.error('Password do not match');
		return false;
	}

	delete user.password;

	return user;
}

export const fetchUserByEmail = async (email: string) => {
	if (constants.dbLayer.currentDB === DBType.MONGODB) {
		const user = await User.findOne({ email });
		logger.info('User found', JSON.stringify(user));
		return user;
	} else if (constants.dbLayer.currentDB === DBType.POSTGRES) {
		const query = 'SELECT * FROM users WHERE email = $1';
		const rows = await executeQuery<any>(query, [email]);
		return rows[0] || null;
	}
};

export const addUser = async (user: IUser): Promise<UserResult> => {
	const { name, email, age, password } = user;
	if (constants.dbLayer.currentDB === DBType.MONGODB) {
		const newUser = new User({ name, email, age, password });
		await newUser.save();
		return { success: true, user: newUser };
	} else if (constants.dbLayer.currentDB === DBType.POSTGRES) {
		const query = `INSERT INTO users (name, email, age, password) VALUES ($1, $2, $3, $4) RETURNING *`;
		const params = [name, email, age, password];

		try {
			const rows = await executeQuery<any>(query, params);
			return { success: true, user: rows[0] || null };
		} catch (error) {
			logger.error(`Failed to create user: ${query} - ${error}`);
			return { success: false };
		}
	}
	return { success: false, message: 'Unknown database' };
};
