import { PubSub } from 'graphql-subscriptions';
import { DBType, IUser } from '../types';
import { User } from '../models';
import { RedisClient } from '../cachingClients/redis';
import { GenericDBConnection, getLimitCond, getGenericDBInstance } from '../dbClients/helper';
import { constants } from '../constants';
import { logger } from '../Logger';

interface UserInput {
	first_name: string;
	last_name: string;
	age: number;
}

interface UserArgs extends Partial<UserInput> {
	id?: string;
}

const { currentDB } = constants.dbLayer;

const pubsub = new PubSub();

let genericDBInstance: GenericDBConnection;
const redisClient = RedisClient.getInstance();
redisClient.connect();
const table = 'TEST_USERS';

const getUser = async (parent: any, args: { id: string }): Promise<IUser | null> => {
	const { id } = args;

	let result = await redisClient.getCachedData(id);

	if (result) {
		return result as IUser;
	}

	if (currentDB === DBType.MONGODB) {
		try {
			const user = await User.findById(id);
			if (user) {
				await redisClient.cacheData(id, user);
			}
			return user;
		} catch (error) {
			logger.error(`Failed to fetch user from MongoDB: ${error}`);
			return null;
		}
	} else {
		const whereClause = id ? `WHERE id = ${id}` : getLimitCond(currentDB, 1);
		const query = `SELECT id, first_name, last_name, age FROM ${table} ${whereClause}`;

		try {
			genericDBInstance = await getGenericDBInstance(currentDB);
			logger.info(`genericDBInstance: ${JSON.stringify(genericDBInstance)}`);
			const rows = await genericDBInstance?.executeQuery<any>(query);
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
		const query: string = `SELECT id, first_name, last_name, "age" FROM ${table} ${whereClause}`;
		try {
			genericDBInstance = await getGenericDBInstance(currentDB);
			const result: IUser[] = await genericDBInstance?.executeQuery<any[]>(query);
			return result;
		} catch (error) {
			logger.error(`Failed to fetch users: ${query} - ${error}`);
			return [];
		}
	}
};

const createUser = async (parent: any, args: UserInput): Promise<boolean> => {
	const { first_name, last_name, age } = args;

	if (currentDB === DBType.MONGODB) {
		try {
			const user = new User({ first_name, last_name, age });
			await user.save();

			pubsub.publish('USER_CREATED', { userCreated: user });

			await redisClient.cacheData(user.id, user);
			return true;
		} catch (error) {
			logger.error(`Failed to create user in MongoDB: ${error}`);
			return false;
		}
	} else {
		const query = `INSERT INTO ${table} (first_name, last_name, age) VALUES ('${first_name}', '${last_name}', ${age})`;

		try {
			genericDBInstance = await getGenericDBInstance(currentDB);
			const result = await genericDBInstance?.executeQuery<any>(query);
			pubsub.publish('USER_CREATED', { userCreated: result });
			logger.info(result);
			return true;
		} catch (error) {
			logger.error(`Failed to create user: ${query} - ${error}`);
			return false;
		}
	}
};

const updateUser = async (parent: any, args: UserArgs & { id: string }): Promise<boolean> => {
	const { id, first_name, last_name, age } = args;

	if (currentDB === DBType.MONGODB) {
		try {
			const user = await User.findByIdAndUpdate(
				id,
				{ first_name, last_name, age },
				{ new: true },
			);
			if (user) {
				await redisClient.cacheData(id, user);
			}
			return !!user;
		} catch (error) {
			logger.error(`Failed to update user in MongoDB: ${error}`);
			return false;
		}
	} else {
		const query = `UPDATE ${table} SET first_name = '${first_name}', last_name = '${last_name}', age = ${age} WHERE id = ${id}`;

		try {
			genericDBInstance = await getGenericDBInstance(currentDB);
			await genericDBInstance?.executeQuery<any>(query);
			return true;
		} catch (error) {
			logger.error(`Failed to update user: ${query} - ${error}`);
			return false;
		}
	}
};

const deleteUser = async (parent: any, args: { id: string }): Promise<boolean> => {
	const { id } = args;

	if (currentDB === DBType.MONGODB) {
		try {
			const result = await User.findByIdAndDelete(id);
			if (result) {
				await redisClient.deleteCachedData(id);
			}
			return !!result;
		} catch (error) {
			logger.error(`Failed to delete user in MongoDB: ${error}`);
			return false;
		}
	} else {
		const query = `DELETE FROM ${table} WHERE id = ${id}`;

		try {
			genericDBInstance = await getGenericDBInstance(currentDB);
			await genericDBInstance?.executeQuery<any>(query);
			return true;
		} catch (error) {
			logger.error(`Failed to delete user : ${query} - ${error}`);
			return false;
		}
	}
};

const userCreated = {
	subscribe: () => pubsub.asyncIterator(['USER_CREATED']),
};

const getUserCreatedResolver = async (): Promise<AsyncIterator<unknown>> => {
	return pubsub.asyncIterator('userCreated');
};

export { getUser, getUsers, createUser, updateUser, deleteUser, userCreated };

/**
 * Oracle
 * create table TEST_USERS ( "id" number generated always as identity, "first_name" varchar2(4000), "last_name" varchar2(4000), "age" number, primary key ("id"));
 * 
 * PGSQL
 * CREATE TABLE "TEST_USERS" (
    id SERIAL PRIMARY KEY,  -- SERIAL is a convenient way to create an auto-incrementing integer primary key
    firstname VARCHAR(4000), -- VARCHAR is the correct type, and length is specified in parentheses
    lastname VARCHAR(4000),  -- VARCHAR is the correct type, and length is specified in parentheses
    age INTEGER               -- INTEGER is the correct type
);
 * 
 * {
 "query": "mutation createUser($first_name: String!, $last_name: String!, $age: Int!) { createUser(first_name: $first_name, last_name: $last_name, age: $age) }",
 "variables": {
   "first_name": "Aasif",
   "last_name": "Rasul",
   "age": 40
 }
}
 * 
 * {
  "query": "{ getUser(id: 1) {id, first_name, last_name, age} }"
}
 * 
 * 
 * {
  "query": "{ getUsers {id, first_name, last_name, age} }"
}
 * 
 * 
 * {
 "query": "mutation updateUser($id: ID!, $first_name: String!, $last_name: String!, $age: Int!) { updateUser(id: $id, first_name: $first_name, last_name: $last_name, age: $age) }",
 "variables": {
   "id": "1",
   "first_name": "John",
   "last_name": "Doe",
   "age": 30
 }
}
 * 
 * 
 * 
 * {
 "query": "mutation deleteUser($id: ID!) { deleteUser(id: $id) }",
 "variables": {
   "id": "2"
 }
}
 * 
 * 
*/
