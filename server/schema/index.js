const graphql = require('graphql');

const { getUser, getUsers, createUser, updateUser, deleteUser } = require('./users');
const {
	getProduct,
	getProducts,
	createProduct,
	updateProduct,
	deleteProduct,
} = require('./products');

const { GraphQLObjectType, GraphQLSchema, GraphQLString } = graphql;

const RootQuery = new GraphQLObjectType({
	name: 'RootQueryType',
	fields: {
		hello: {
			type: GraphQLString,
			resolve: () => 'world',
		},
		getUser,
		getUsers,
		getProduct,
		getProducts,
	},
});

const Mutation = new GraphQLObjectType({
	name: 'Mutation',
	fields: {
		createUser,
		updateUser,
		deleteUser,
		createProduct,
		updateProduct,
		deleteProduct,
	},
});

const schema = new GraphQLSchema({
	query: RootQuery,
	mutation: Mutation,
});

module.exports = {
	schema,
};
