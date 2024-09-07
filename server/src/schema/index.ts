import { makeExecutableSchema } from '@graphql-tools/schema';
import { validateSchema } from 'graphql';

import { typeDefs } from './typeDefs';
import { logger } from '../Logger';

import { getUser, getUsers, createUser, updateUser, deleteUser, userCreated } from './users';

import {
	getProduct,
	getProducts,
	createProduct,
	updateProduct,
	deleteProduct,
} from './products';

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

validateGraphqlSchema();

export { schema };
