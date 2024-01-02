const graphql = require('graphql');

const connection = require('../mysqlClient');
const { logger } = require('../Logger');
const { safeStringify } = require('../helper');

const { GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLID, GraphQLSchema, GraphQLList } =
	graphql;

const UserType = new GraphQLObjectType({
	name: 'User',
	fields: () => ({
		id: { type: GraphQLID },
		firstName: { type: GraphQLString },
		lastName: { type: GraphQLString },
		age: { type: GraphQLInt },
	}),
});

const RootQuery = new GraphQLObjectType({
	name: 'RootQueryType',
	fields: {
		hello: {
			type: GraphQLString,
			resolve: () => 'world',
		},
		user: {
			type: new GraphQLList(UserType),
			args: {
				id: { type: GraphQLID },
				firstName: { type: GraphQLString },
				lastName: { type: GraphQLString },
				age: { type: GraphQLInt },
			},
			resolve: async (parent, args) => {
				const conditions = Object.keys(args);
				let whereClause = 'LIMIT 10';
				if (conditions.length) {
					whereClause =
						'WHERE ' +
						conditions.map((key) => `${key} = '${args[key]}'`).join(' AND ');
				}
				const query = `SELECT * FROM TEST_USERS ${whereClause}`;

				logger.info(query);

				let rows = await new Promise((resolve, reject) => {
					connection.query(query, (error, results) =>
						error ? reject(error) : resolve(results),
					);
				});
				rows = rows.map(({ id, firstName, lastName, age }) => ({
					id,
					firstName,
					lastName,
					age,
				}));

				logger.info(rows);

				return rows;
			},
		},
	},
});

const schema = new GraphQLSchema({
	query: RootQuery,
});

module.exports = {
	schema,
};
