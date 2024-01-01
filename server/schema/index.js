const graphql = require('graphql');

const { GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLID, GraphQLSchema } = graphql;

const UserType = new GraphQLObjectType({
	name: 'User',
	fields: () => ({
		id: { type: GraphQLID },
		name: { type: GraphQLString },
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
			type: UserType,
			args: { id: { type: GraphQLID } },
			resolve(parent, args) {
				console.log('parent', parent);
				console.log('args', args);
				// code to get data from db / other source
				return {
					id: 1,
					name: 'Aasif Rasul',
					age: 40,
				};
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
