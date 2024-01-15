const graphql = require('graphql');

const { getUser, getUsers, createUser, updateUser, deleteUser } = require('./users');
const {
	getProduct,
	getProducts,
	createProduct,
	updateProduct,
	deleteProduct,
} = require('./products');

const DBConnection = require('../dbClients/postgresql');

const { GraphQLObjectType, GraphQLSchema } = graphql;

const RootQuery = new GraphQLObjectType({
	name: 'RootQueryType',
	fields: {
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

const dbCleanup = () => {
	const dbConnection = DBConnection.getInstance();
	dbConnection?.closePool();
};

module.exports = {
	schema,
	dbCleanup,
};
