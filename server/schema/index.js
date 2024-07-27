const {
	GraphQLObjectType,
	GraphQLSchema,
	GraphQLString,
	GraphQLInt,
	GraphQLFloat,
	GraphQLList,
	GraphQLNonNull,
} = require('graphql');

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

const rootValue = {
	quoteOfTheDay: {
		type: GraphQLString,
		resolve: () => (Math.random() < 0.5 ? 'Take it easy' : 'Salvation lies within'),
	},
	random: {
		type: GraphQLFloat,
		resolve: () => Math.random(),
	},
	rollThreeDice: {
		type: new GraphQLList(new GraphQLNonNull(GraphQLInt)),
		resolve: () => [1, 2, 3].map((_) => 1 + Math.floor(Math.random() * 6)),
	},
};

const RootQuery = new GraphQLObjectType({
	name: 'RootQueryType',
	fields: {
		getUser,
		getUsers,
		getProduct,
		getProducts,
		...rootValue,
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

const Subscription = new GraphQLObjectType({
	name: 'Subscription',
	fields: {
		userCreated,
	},
});

/*
const Subscription = new GraphQLObjectType({
	name: 'Subscription',
	fields: {
		messageAdded: {
			type: GraphQLString,
			subscribe: () => pubsub.asyncIterator([MESSAGE_ADDED_TOPIC]),
			resolve: (payload) => {
				return payload;
			},
		},
	},
});
*/

/*
// Example of publishing an event when a user is created
createUser.resolve = async (parent, args, context, info) => {
	// Create the user
	const newUser = await createUser(args);

	// Publish the event
	pubsub.publish('userCreated', { newUser });

	return newUser;
};
*/

const schema = new GraphQLSchema({
	query: RootQuery,
	mutation: Mutation,
	subscription: Subscription,
});

module.exports = {
	schema,
};
