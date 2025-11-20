import { makeExecutableSchema } from '@graphql-tools/schema';
import { assertValidSchema, printSchema, validateSchema } from 'graphql';

import { constants } from '../constants';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { RedisClient } from '../cachingClients/redis';

import { typeDefs } from './typeDefs';
import { logger } from '../Logger';

import {
	getProduct,
	getProducts,
	createProduct,
	updateProduct,
	deleteProduct,
} from './products';

import { getBook, getBooks, addBook, updateBook, deleteBook, bookCreated } from './bookStore';
import { makeCRUDResolvers } from './makeCRUDResolvers';
import { IUser } from '../types';
import { User } from '../models';

const pubsub = new RedisPubSub();
const redisClient = RedisClient.getInstance();

// Usage:
const userResolvers = makeCRUDResolvers<IUser>({
	model: User,
	table: 'users',
	eventKey: 'USER_CREATED',
	columns: ['id', 'name', 'email', 'age'],
	redisClient,
	pubsub,
	entityName: 'user',
});

export const {
	getOne: getUser,
	getAll: getUsers,
	create: createUser,
	update: updateUser,
	delete: deleteUser,
	subscription: userCreated,
} = userResolvers;

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
	assertValidSchema(schema);
	logger.info(printSchema(schema)); // Logs schema for inspection

	if (errors.length > 0) {
		logger.error('Schema validation errors:', errors);
	}
}

validateGraphqlSchema();

export { schema };
