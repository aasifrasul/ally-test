const {
	GraphQLObjectType,
	GraphQLString,
	GraphQLInt,
	GraphQLID,
	GraphQLList,
	GraphQLNonNull,
	GraphQLBoolean,
} = require('graphql');

const { getLimitCond, getDBInstance } = require('./helper');
const { logger } = require('../Logger');

let dBInstance;
const dbType = 'postgresql';

const UserType = new GraphQLObjectType({
	name: 'Users',
	fields: () => ({
		id: { type: GraphQLID },
		firstName: { type: GraphQLString },
		lastName: { type: GraphQLString },
		age: { type: GraphQLInt },
	}),
});

const getUser = {
	type: UserType,
	args: {
		id: { type: GraphQLID },
	},
	resolve: async (parent, args) => {
		dBInstance = dBInstance || (await getDBInstance(dbType));
		const whereClause = args.id ? `WHERE id = ${args.id}` : getLimitCond(dbType, 1);
		const query = `SELECT id, "firstName", "lastName", age FROM TEST_USERS ${whereClause}`;
		const rows = await dBInstance.executeQuery(query);
		return rows[0];
	},
};

const getUsers = {
	type: new GraphQLList(UserType),
	args: {
		id: { type: GraphQLID },
		firstName: { type: GraphQLString },
		lastName: { type: GraphQLString },
		age: { type: GraphQLInt },
	},
	resolve: async (parent, args) => {
		dBInstance = dBInstance || (await getDBInstance(dbType));
		const keys = Object.keys(args);
		let whereClause = getLimitCond(dbType, 10);
		if (keys.length) {
			whereClause =
				'WHERE ' + keys.map((key) => `"${key}" = '${args[key]}'`).join(' AND ');
		}
		const query = `SELECT id, "firstName", "lastName", "age" FROM TEST_USERS ${whereClause}`;
		return await dBInstance.executeQuery(query);
	},
};

const createUser = {
	type: new GraphQLNonNull(GraphQLBoolean),
	args: {
		firstName: { type: new GraphQLNonNull(GraphQLString) },
		lastName: { type: new GraphQLNonNull(GraphQLString) },
		age: { type: new GraphQLNonNull(GraphQLInt) },
	},
	resolve: async (parent, args, { pubsub }) => {
		dBInstance = dBInstance || (await getDBInstance(dbType));
		try {
			const { firstName, lastName, age } = args;
			const query = `INSERT INTO TEST_USERS ("firstName", "lastName", age) VALUES ('${firstName}', '${lastName}', ${age})`;
			const result = await dBInstance.executeQuery(query);

			// Publish the event
			pubsub.publish('userCreated', { result });

			logger.info(result);
			return true;
		} catch (error) {
			logger.error(`Failed to create user ${error}`);
			return false;
		}
	},
};

const updateUser = {
	type: new GraphQLNonNull(GraphQLBoolean),
	args: {
		id: { type: new GraphQLNonNull(GraphQLID) },
		firstName: { type: GraphQLString },
		lastName: { type: GraphQLString },
		age: { type: GraphQLInt },
	},
	resolve: async (parent, args) => {
		dBInstance = dBInstance || (await getDBInstance(dbType));
		try {
			const { id, firstName, lastName, age } = args;
			const query = `UPDATE TEST_USERS SET "firstName" = '${firstName}', "lastName" = '${lastName}', age = ${age} WHERE id = ${id}`;
			const result = await dBInstance.executeQuery(query);
			logger.info(result);
			return true;
		} catch (error) {
			logger.error(`Failed to update user ${error}`);
		}
	},
};

const deleteUser = {
	type: new GraphQLNonNull(GraphQLBoolean),
	args: {
		id: { type: new GraphQLNonNull(GraphQLID) },
	},
	resolve: async (parent, args) => {
		dBInstance = dBInstance || (await getDBInstance(dbType));
		try {
			const query = `DELETE FROM TEST_USERS WHERE id = ${args.id}`;
			const result = await dBInstance.executeQuery(query);
			logger.info(result);
			return true;
		} catch (error) {
			logger.error(`Failed to DELETE user with id ${args.id} ${error}`);
		}
	},
};

const userCreated = {
	type: GraphQLString, // Adjust the return type as needed
	args: {
		firstName: { type: new GraphQLNonNull(GraphQLString) },
		lastName: { type: new GraphQLNonNull(GraphQLString) },
		age: { type: new GraphQLNonNull(GraphQLInt) },
	}, // Add any necessary arguments
	resolve: (payload, args, { pubsub }) => pubsub.asyncIterator('userCreated'),
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
 "query": "mutation UpdateUser($id: ID!, $firstName: String, $lastName: String, $age: Int) { updateUser(id: $id, firstName: $firstName, lastName: $lastName, age: $age) }",
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
