const { makeExecutableSchema } = require('@graphql-tools/schema');
const { validateSchema } = require('graphql');

const { typeDefs } = require('./typeDefs');

const {
	getUser,
	getUsers,
	createUser,
	updateUser,
	deleteUser,
	userCreated,
} = require('./users');
const {
	getProduct,
	getProducts,
	createProduct,
	updateProduct,
	deleteProduct,
} = require('./products');

const resolvers = {
	Query: {
		getUser,
		getUsers,
		getProduct,
		getProducts,
	},
	Mutation: {
		createUser,
		updateUser,
		deleteUser,
		createProduct,
		updateProduct,
		deleteProduct,
	},
	Subscription: {
		userCreated,
	},
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

function validateGraphqlSchema() {
	const errors = validateSchema(schema);

	if (errors.length > 0) {
		logger.error('Schema validation errors:', errors);
	}
}

validateGraphqlSchema(schema);

module.exports = {
	schema,
};
