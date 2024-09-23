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

// Define scalar types
const BOOLEAN = GraphQLBoolean;
const STRING = GraphQLString;
const INT = GraphQLInt;
const ID = GraphQLID;

// Define base fields
const UserBase: GraphQLFieldConfigMap<any, any> = {
	firstName: { type: STRING },
	lastName: { type: STRING },
	age: { type: INT },
};

const ProductBase: GraphQLFieldConfigMap<any, any> = {
	name: { type: STRING },
	category: { type: STRING },
};

// Define record types (including ID)
const UserRecord: GraphQLFieldConfigMap<any, any> = {
	id: { type: new GraphQLNonNull(ID) },
	...UserBase,
};

const ProductRecord: GraphQLFieldConfigMap<any, any> = {
	id: { type: new GraphQLNonNull(ID) },
	...ProductBase,
};

// Define GraphQL Object Types
const UserType = new GraphQLObjectType({
	name: 'User',
	fields: () => UserRecord,
});

const ProductType = new GraphQLObjectType({
	name: 'Product',
	fields: () => ProductRecord,
});

// Define List types
const ProductList = new GraphQLList(ProductType);
const UserList = new GraphQLList(UserType);

export {
	BOOLEAN,
	STRING,
	INT,
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
