import { PubSub } from 'graphql-subscriptions';
import { DBType } from '../types';
import { User, IUser } from '../models';
import redisClient from '../cachingClients/redis';
import { getLimitCond, getDBInstance } from './helper';
import { constants } from '../constants';
import { logger } from '../Logger';

const { currentDB } = constants.dbLayer;

const pubsub = new PubSub();

let dBInstance: any;

interface UserInput {
	firstName: string;
	lastName: string;
	age: number;
}

interface UserArgs extends Partial<UserInput> {
	id?: string;
}

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
		dBInstance = dBInstance || (await getDBInstance(currentDB));
		const whereClause = id ? `WHERE id = ${id}` : getLimitCond(currentDB, 1);
		const query = `SELECT id, "firstName", "lastName", age FROM TEST_USERS ${whereClause}`;
		const rows = await dBInstance.executeQuery(query);
		return rows[0] || null;
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
		dBInstance = dBInstance || (await getDBInstance(currentDB));

		let whereClause = getLimitCond(currentDB, 10);
		if (keys.length) {
			whereClause =
				'WHERE ' +
				keys.map((key) => `"${key}" = '${args[key as keyof UserArgs]}'`).join(' AND ');
		}
		const query = `SELECT id, "firstName", "lastName", "age" FROM TEST_USERS ${whereClause}`;
		return await dBInstance.executeQuery(query);
	}
};

const createUser = async (parent: any, args: UserInput): Promise<boolean> => {
	const { firstName, lastName, age } = args;

	if (currentDB === DBType.MONGODB) {
		try {
			const user = new User({ firstName, lastName, age });
			await user.save();

			pubsub.publish('USER_CREATED', { userCreated: user });

			await redisClient.cacheData(user.id, user);
			return true;
		} catch (error) {
			logger.error(`Failed to create user in MongoDB: ${error}`);
			return false;
		}
	} else {
		dBInstance = dBInstance || (await getDBInstance(currentDB));

		try {
			const query = `INSERT INTO TEST_USERS ("firstName", "lastName", age) VALUES ('${firstName}', '${lastName}', ${age})`;
			const result = await dBInstance.executeQuery(query);

			pubsub.publish('USER_CREATED', { userCreated: result });

			logger.info(result);
			return true;
		} catch (error) {
			logger.error(`Failed to create user: ${error}`);
			return false;
		}
	}
};

const updateUser = async (parent: any, args: UserArgs & { id: string }): Promise<boolean> => {
	const { id, firstName, lastName, age } = args;

	if (currentDB === DBType.MONGODB) {
		try {
			const user = await User.findByIdAndUpdate(
				id,
				{ firstName, lastName, age },
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
		dBInstance = dBInstance || (await getDBInstance(currentDB));
		try {
			const query = `UPDATE TEST_USERS SET "firstName" = '${firstName}', "lastName" = '${lastName}', age = ${age} WHERE id = ${id}`;
			await dBInstance.executeQuery(query);
			return true;
		} catch (error) {
			logger.error(`Failed to update user: ${error}`);
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
		dBInstance = dBInstance || (await getDBInstance(currentDB));
		try {
			const query = `DELETE FROM TEST_USERS WHERE id = ${id}`;
			await dBInstance.executeQuery(query);
			return true;
		} catch (error) {
			logger.error(`Failed to delete user with id ${id}: ${error}`);
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
 *
 * @api {post} /graphql GraphQL
 SQL table creation:
 create table TEST_USERS ( "id" number generated always as identity, "firstName" varchar2(4000), "lastName" varchar2(4000), "age" number, primary key ("id"));

 GraphQL mutation examples:

 Create User:
 mutation createUser($firstName: String!, $lastName: String!, $age: Int!) {
   createUser(firstName: $firstName, lastName: $lastName, age: $age)
 }

 Update User:
 mutation updateUser($id: ID!, $firstName: String!, $lastName: String!, $age: Int!) {
   updateUser(id: $id, firstName: $firstName, lastName: $lastName, age: $age)
 }

 Delete User:
 mutation deleteUser($id: ID!) {
   deleteUser(id: $id)
 }

 GraphQL query examples:

 Get User:
 query {
   getUser(id: "1") {
     id
     firstName
     lastName
     age
   }
 }

 Get Users:
 query {
   getUsers {
     id
     firstName
     lastName
     age
   }
 }
*/