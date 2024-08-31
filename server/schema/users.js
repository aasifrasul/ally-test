const { PubSub } = require('graphql-subscriptions');

const { User } = require('../models');
const { cacheData, getCachedData, deleteCachedData } = require('../cachingClients/redis');

const { getLimitCond, getDBInstance } = require('./helper');
const { constants } = require('../constants');
const { logger } = require('../Logger');

const pubsub = new PubSub();

const currentDB = constants?.dbLayer?.currentDB;

let dBInstance;

const getUser = async (parent, args) => {
	const { id } = args;

	let result = await getCachedData(id);

	if (result) {
		return result;
	}

	if (currentDB === 'mongodb') {
		try {
			const user = await User.findById(id);
			cacheData(id, user);
			return user;
		} catch (error) {
			logger.error(`Failed to create user in MongoDB: ${error}`);
			return false;
		}
	} else {
		dBInstance = dBInstance || (await getDBInstance(currentDB));
		const whereClause = id ? `WHERE id = ${id}` : getLimitCond(currentDB, 1);
		const query = `SELECT id, "firstName", "lastName", age FROM TEST_USERS ${whereClause}`;
		const rows = await dBInstance.executeQuery(query);
		return rows[0];
	}
};

const getUsers = async (parent, args = {}) => {
	const keys = Object.keys(args);

	if (currentDB === 'mongodb') {
		try {
			const params = keys.reduce((acc, key) => {
				acc[key] = { $regex: new RegExp(`\\d*${args[key]}\\d*`) };
				return acc;
			}, {});

			const users = await User.find(params);
			return users;
		} catch (error) {
			logger.error(`Failed to create user in MongoDB: ${error}`);
			return false;
		}
	} else {
		dBInstance = dBInstance || (await getDBInstance(currentDB));

		let whereClause = getLimitCond(currentDB, 10);
		if (keys.length) {
			whereClause =
				'WHERE ' + keys.map((key) => `"${key}" = '${args[key]}'`).join(' AND ');
		}
		const query = `SELECT id, "firstName", "lastName", "age" FROM TEST_USERS ${whereClause}`;
		return await dBInstance.executeQuery(query);
	}
};

const createUser = async (parent, args) => {
	const { firstName, lastName, age } = args;

	if (currentDB === 'mongodb') {
		try {
			const user = new User({ firstName, lastName, age });
			await user.save();

			// Publish the event
			pubsub.publish('USER_CREATED', { userCreated: user });

			cacheData(user.id, user);
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

			// Publish the event
			pubsub.publish('USER_CREATED', { userCreated: result });

			logger.info(result);
			return true;
		} catch (error) {
			logger.error(`Failed to create user ${error}`);
			return false;
		}
	}
};

const updateUser = async (parent, args) => {
	const { id, firstName, lastName, age } = args;

	if (currentDB === 'mongodb') {
		try {
			const user = await User.findByIdAndUpdate(
				id,
				{ firstName, lastName, age },
				{ new: true },
			);
			cacheData(id, user);
			return true;
		} catch (error) {
			logger.error(`Failed to create user in MongoDB: ${error}`);
			return false;
		}
	} else {
		dBInstance = dBInstance || (await getDBInstance(currentDB));
		try {
			const query = `UPDATE TEST_USERS SET "firstName" = '${firstName}', "lastName" = '${lastName}', age = ${age} WHERE id = ${id}`;
			const result = await dBInstance.executeQuery(query);
			return true;
		} catch (error) {
			logger.error(`Failed to update user ${error}`);
		}
	}
};

const deleteUser = async (parent, args) => {
	const { id } = args;

	if (currentDB === 'mongodb') {
		try {
			await User.findByIdAndDelete(id, { new: true });
			deleteCachedData(id);
			return true;
		} catch (error) {
			logger.error(`Failed to create user in MongoDB: ${error}`);
			return false;
		}
	} else {
		dBInstance = dBInstance || (await getDBInstance(currentDB));
		try {
			const query = `DELETE FROM TEST_USERS WHERE id = ${id}`;
			const result = await dBInstance.executeQuery(query);
			return true;
		} catch (error) {
			logger.error(`Failed to DELETE user with id ${id} ${error}`);
		}
	}
};

const userCreated = {
	subscribe: () => pubsub.asyncIterator(['USER_CREATED']),
};

// Example resolver for userCreated subscription
const getUserCreatedResolver = async (parent, args, context, info) => {
	return pubsub.asyncIterator('userCreated');
};

module.exports = { getUser, getUsers, createUser, updateUser, deleteUser, userCreated };

/**
 * create table TEST_USERS ( "id" number generated always as identity, "firstName" varchar2(4000), "lastName" varchar2(4000), "age" number, primary key ("id"));
 * 
 * {
 "query": "mutation createUser($firstName: String!, $lastName: String!, $age: Int!) { createUser(firstName: $firstName, lastName: $lastName, age: $age) }",
 "variables": {
   "firstName": "Aasif",
   "lastName": "Rasul",
   "age": 40
 }
}
 * 
 * {
  "query": "{ getUser(id: 1) {id, firstName, lastName, age} }"
}
 * 
 * 
 * {
  "query": "{ getUsers {id, firstName, lastName, age} }"
}
 * 
 * 
 * {
 "query": "mutation updateUser($id: ID!, $firstName: String!, $lastName: String!, $age: Int!) { updateUser(id: $id, firstName: $firstName, lastName: $lastName, age: $age) }",
 "variables": {
   "id": "1",
   "firstName": "John",
   "lastName": "Doe",
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
