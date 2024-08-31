const {
	GraphQLObjectType,
	GraphQLString,
	GraphQLInt,
	GraphQLID,
	GraphQLList,
	GraphQLNonNull,
	GraphQLBoolean,
} = require('graphql');

const BOOLEAN = new GraphQLNonNull(GraphQLBoolean);

const STRING = new GraphQLNonNull(GraphQLString);

const ID = { id: { type: new GraphQLNonNull(GraphQLID) } };

const UserBase = {
	firstName: { type: GraphQLString },
	lastName: { type: GraphQLString },
	age: { type: GraphQLInt },
};

const ProductBase = {
	name: { type: GraphQLString },
	category: { type: GraphQLString },
};

const UserRecord = {
	...ID,
	...UserBase,
};

const ProductRecord = {
	...ID,
	...ProductBase,
};

const UserType = new GraphQLObjectType({
	name: 'Users',
	fields: () => UserRecord,
});

const ProductType = new GraphQLObjectType({
	name: 'Products',
	fields: () => ProductRecord,
});

const ProductList = new GraphQLList(ProductType);
const UserList = new GraphQLList(UserType);

module.exports = {
	BOOLEAN,
	STRING,
	ID,
	ProductType,
	ProductRecord,
	ProductBase,
	ProductList,
	UserType,
	UserRecord,
	UserBase,
	UserList,
};
