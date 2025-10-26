import { PubSub } from 'graphql-subscriptions';
import { DBType, IUser, UserResult, DeleteResult } from '../types';
import { User } from '../models';
import { RedisClient } from '../cachingClients/redis';
import { getLimitCond, executeQuery } from '../dbClients/helper';
import { constants } from '../constants';
import { logger } from '../Logger';

interface UserArgs extends Partial<IUser> {
	id?: string;
}

const { currentDB } = constants.dbLayer;

const pubsub = new PubSub();

const redisClient = RedisClient.getInstance();
const table = `"TEST_USERS"`;

const getUser = async (parent: any, args: { id: string }): Promise<IUser | null> => {
	const { id } = args;

	let result = await redisClient.get(id);

	if (result) {
		return result as IUser;
	}

	if (currentDB === DBType.MONGODB) {
		try {
			const user = await User.findById(id);
			if (user) {
				await redisClient.set(id, user);
			}
			return user;
		} catch (error) {
			logger.error(`Failed to fetch user from MongoDB: ${error}`);
			return null;
		}
	} else {
		const whereClause = id ? `WHERE id = $1` : getLimitCond(currentDB, 1);
		const query = `SELECT id, name, email, age FROM ${table} ${whereClause}`;

		try {
			const rows = await executeQuery<any>(query, [id]);
			return rows[0] || null;
		} catch (err) {
			logger.error(`Failed to fetch user: ${query} - ${err}`);
			return null;
		}
	}
};

const getUsers = async (parent: any, args: UserArgs = {}): Promise<IUser[]> => {
	const keys = Object.keys(args);

	if (currentDB === DBType.MONGODB) {
		try {
			const params = keys.reduce((acc: Record<string, { $regex: RegExp }>, key) => {
				acc[key] = { $regex: new RegExp(`\\d*${args[key as keyof UserArgs]}\\d*`) };
				return acc;
			}, {});

			return await User.find(params);
		} catch (error) {
			logger.error(`Failed to fetch users from MongoDB: ${error}`);
			return [];
		}
	} else {
		let whereClause = getLimitCond(currentDB, 10);
		if (keys.length) {
			whereClause =
				'WHERE ' +
				keys.map((key) => `"${key}" = '${args[key as keyof UserArgs]}'`).join(' AND ');
		}
		const query: string = `SELECT id, name, email, "age" FROM ${table} ${whereClause}`;
		try {
			const result: IUser[] = await executeQuery(query);
			return result;
		} catch (error) {
			logger.error(`Failed to fetch users: ${query} - ${error}`);
			return [];
		}
	}
};

const createUser = async (parent: any, args: IUser): Promise<UserResult> => {
	const { name, email, age, password } = args;

	if (currentDB === DBType.MONGODB) {
		try {
			const user = new User({ name, email, age, password });
			await user.save();

			pubsub.publish('USER_CREATED', { userCreated: user });

			await redisClient.set(user.id, user);
			return { success: true, user };
		} catch (error) {
			logger.error(`Failed to create user in MongoDB: ${error}`);
			return { success: false };
		}
	} else {
		const query = `INSERT INTO ${table} (name, email, age, password) VALUES ($1, $2, $3, $4) RETURNING *`;
		const params = [name, email, age, password];

		try {
			const rows = await executeQuery<any>(query, params);
			logger.info(JSON.stringify(rows));
			pubsub.publish('USER_CREATED', { userCreated: rows });
			return { success: true, user: rows[0] || null };
		} catch (error) {
			logger.error(`Failed to create user: ${query} - ${error}`);
			return { success: false };
		}
	}
};

const updateUser = async (
	parent: any,
	args: UserArgs & { id: string },
): Promise<UserResult> => {
	const { id, name, email, age } = args;

	if (currentDB === DBType.MONGODB) {
		try {
			const user = await User.findByIdAndUpdate(id, { name, email, age }, { new: true });
			if (!user) return { success: false };
			if (user) {
				await redisClient.set(id, user);
			}
			return { success: true, user };
		} catch (error) {
			logger.error(`Failed to update user in MongoDB: ${error}`);
			return { success: false };
		}
	} else {
		const query = `UPDATE ${table} SET name = $1, email = $2, age = $3, WHERE id = $4 RETURNING *`;
		const params = [name, email, age, id];

		try {
			const rows = await executeQuery<any>(query, params);
			return { success: true, user: rows[0] || null };
		} catch (error) {
			logger.error(`Failed to update user: ${query} - ${error}`);
			return { success: false };
		}
	}
};

const deleteUser = async (
	parent: any,
	args: { id: string },
): Promise<Partial<DeleteResult>> => {
	const { id } = args;

	if (currentDB === DBType.MONGODB) {
		try {
			const result = await User.findByIdAndDelete(id);
			if (!result) return { success: false };
			if (result) {
				await redisClient.deleteCachedData(id);
			}
			return { success: true, id };
		} catch (error) {
			logger.error(`Failed to delete user in MongoDB: ${error}`);
			return { success: false, id };
		}
	} else {
		const query = `DELETE FROM ${table} WHERE id = $1`;

		try {
			await executeQuery<any>(query, [id]);
			return { success: true, id };
		} catch (error) {
			logger.error(`Failed to delete user : ${query} - ${error}`);
			return { success: false, id };
		}
	}
};

const userCreated = {
	subscribe: () => pubsub.asyncIterableIterator(['USER_CREATED']),
};

const getUserCreatedResolver = async (): Promise<AsyncIterator<unknown>> => {
	return pubsub.asyncIterableIterator('userCreated');
};

export { getUser, getUsers, createUser, updateUser, deleteUser, userCreated };

/**
 * Oracle
 * create table TEST_USERS ( "id" number generated always as identity, "name" varchar2(4000), "email" varchar2(4000), "age" number, primary key ("id"));
 * 
 * PGSQL
 * 
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE "TEST_USERS" (
	id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
	name VARCHAR(4000), -- VARCHAR is the correct type, and length is specified in parentheses
	email VARCHAR(4000),  -- VARCHAR is the correct type, and length is specified in parentheses
	age INTEGER,               -- INTEGER is the correct type
	password VARCHAR(4000)
);
 * 
 * {
	"query": "mutation createUser($name: String!, $email: String!, $age: Int!, $password: String!) { createUser(name: $name, email: $email, age: $age) { success message user { id name email age } } }",
	"variables": {
		"name": "Aasif",
		"email": "Rasul",
		"age": 40,
		"password": "sgdfhdfjfgj"
	},
	"operationName": "createUser"
}
 * 
 * 
 * {
	"query": "{ getUser(id: \"86d9a167-d37d-4cc6-badd-06c21daa0d72\") {id, name, email, age} }"
}
 * 
 * 
 * {
	"query": "{ getUsers {id, name, email, age} }"
}
 * 
 * 
 * {
 "query": "mutation updateUser($id: ID!, $name: String!, $email: String!, $age: Int!) { updateUser(id: $id, name: $name, email: $email, age: $age) { success message user { id name email age } } }",
 "variables": {
	 "id": "86d9a167-d37d-4cc6-badd-06c21daa0d72",
	 "name": "John",
	 "email": "Doe",
	 "age": 30
 }
}
 * 
 * 
 * 
 * {
 "query": "mutation deleteUser($id: ID!) { deleteUser(id: $id) { success message id } }",
 "variables": {
	 "id": "86d9a167-d37d-4cc6-badd-06c21daa0d72"
 }
}
 * 
 * 
*/
