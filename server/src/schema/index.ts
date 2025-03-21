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

import { getBook, getBooks, addBook, updateBook, deleteBook, bookCreated } from './bookStore';

const resolvers = {
	Query: {
		getUser,
		getUsers,
		getProduct,
		getProducts,
		getBook,
		getBooks,
	},
	Mutation: {
		createUser,
		updateUser,
		deleteUser,
		createProduct,
		updateProduct,
		deleteProduct,
		addBook,
		updateBook,
		deleteBook,
	},
	Subscription: {
		userCreated,
		bookCreated,
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
