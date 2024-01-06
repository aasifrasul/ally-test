const graphql = require('graphql');

const { executeQuery } = require('../dbClients/oracle');
const { logger } = require('../Logger');

const {
	GraphQLObjectType,
	GraphQLString,
	GraphQLInt,
	GraphQLID,
	GraphQLSchema,
	GraphQLList,
	GraphQLNonNull,
	GraphQLBoolean,
} = graphql;

const UserType = new GraphQLObjectType({
	name: 'Users',
	fields: () => ({
		id: { type: GraphQLID },
		firstName: { type: GraphQLString },
		lastName: { type: GraphQLString },
		age: { type: GraphQLInt },
	}),
});

const getLimitCond = (dbType, count) => {
	switch (dbType) {
		case 'mysql':
			return `LIMT ${count}`;
		case 'oracle':
			return `FETCH FIRST ${count} ROWS ONLY`;
		default:
			return '';
	}
};

const RootQuery = new GraphQLObjectType({
	name: 'RootQueryType',
	fields: {
		hello: {
			type: GraphQLString,
			resolve: () => 'world',
		},
		getUser: {
			type: UserType,
			args: {
				id: { type: GraphQLID },
			},
			resolve: async (parent, args) => {
				const whereClause = args.id
					? `WHERE "id" = ${args.id}`
					: getLimitCond('oracle', 1);
				const query = `SELECT "id", "firstName", "lastName", "age" FROM TEST_USERS ${whereClause}`;
				const rows = await executeQuery(query);
				return rows[0];
			},
		},
		getUsers: {
			type: new GraphQLList(UserType),
			args: {
				id: { type: GraphQLID },
				firstName: { type: GraphQLString },
				lastName: { type: GraphQLString },
				age: { type: GraphQLInt },
			},
			resolve: async (parent, args) => {
				const keys = Object.keys(args);
				let whereClause = getLimitCond('oracle', 10);
				if (keys.length) {
					whereClause =
						'WHERE ' +
						keys.map((key) => `"${key}" = '${args[key]}'`).join(' AND ');
				}
				const query = `SELECT "id", "firstName", "lastName", "age" FROM TEST_USERS ${whereClause}`;
				return await executeQuery(query);
			},
		},
	},
});

const Mutation = new GraphQLObjectType({
	name: 'Mutation',
	fields: {
		createUser: {
			type: new GraphQLNonNull(GraphQLBoolean),
			args: {
				firstName: { type: new GraphQLNonNull(GraphQLString) },
				lastName: { type: new GraphQLNonNull(GraphQLString) },
				age: { type: new GraphQLNonNull(GraphQLInt) },
			},
			resolve: async (parent, args) => {
				try {
					const { firstName, lastName, age } = args;
					const query = `INSERT INTO TEST_USERS ("firstName", "lastName", "age") VALUES ('${firstName}', '${lastName}', ${age})`;
					const result = await executeQuery(query);
					logger.info(result);
					return true;
				} catch (error) {
					logger.error(`Failed to create user ${error}`);
				}
			},
		},
		updateUser: {
			type: new GraphQLNonNull(GraphQLBoolean),
			args: {
				id: { type: new GraphQLNonNull(GraphQLID) },
				firstName: { type: GraphQLString },
				lastName: { type: GraphQLString },
				age: { type: GraphQLInt },
			},
			resolve: async (parent, args) => {
				try {
					const { id, firstName, lastName, age } = args;
					const query = `UPDATE TEST_USERS SET "firstName" = '${firstName}', "lastName" = '${lastName}', "age" = ${age} WHERE "id" = ${id}`;
					const result = await executeQuery(query);
					logger.info(result);
					return true;
				} catch (error) {
					logger.error(`Failed to update user ${error}`);
				}
			},
		},
		deleteUser: {
			type: new GraphQLNonNull(GraphQLBoolean),
			args: {
				id: { type: new GraphQLNonNull(GraphQLID) },
			},
			resolve: async (parent, args) => {
				try {
					const query = `DELETE FROM TEST_USERS WHERE "id" = ${args.id}`;
					const result = await executeQuery(query);
					logger.info(result);
					return true;
				} catch (error) {
					logger.error(`Failed to DELETE user with id ${args.id} ${error}`);
				}
			},
		},
	},
});

const schema = new GraphQLSchema({
	query: RootQuery,
	mutation: Mutation,
});

module.exports = {
	schema,
};
