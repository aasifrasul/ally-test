const graphql = require('graphql');

const { GraphQLObjectType, GraphQLString, GraphQLID, GraphQLList, GraphQLSchema } = graphql;

const schema = new GraphQLSchema({
	query: new GraphQLObjectType({
		name: 'Query',
		fields: {
			hello: {
				type: GraphQLString,
				resolve: () => 'world',
			},
		},
	}),
});

module.exports = {
	schema,
};
