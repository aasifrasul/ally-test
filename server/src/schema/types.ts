import {
	GraphQLObjectType,
	GraphQLString,
	GraphQLInt,
	GraphQLID,
	GraphQLList,
	GraphQLNonNull,
	GraphQLBoolean,
	GraphQLFieldConfigMap,
} from 'graphql';

const BOOLEAN = new GraphQLNonNull(GraphQLBoolean);

const STRING = new GraphQLNonNull(GraphQLString);

const ID: { id: { type: GraphQLNonNull<typeof GraphQLID> } } = {
	id: { type: new GraphQLNonNull(GraphQLID) },
};

const UserBase: GraphQLFieldConfigMap<any, any> = {
	firstName: { type: GraphQLString },
	lastName: { type: GraphQLString },
	age: { type: GraphQLInt },
};

const ProductBase: GraphQLFieldConfigMap<any, any> = {
	name: { type: GraphQLString },
	category: { type: GraphQLString },
};

const UserRecord: GraphQLFieldConfigMap<any, any> = {
	...ID,
	...UserBase,
};

const ProductRecord: GraphQLFieldConfigMap<any, any> = {
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

export {
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
