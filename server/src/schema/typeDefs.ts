const typeDefs = `
	type Query {
		getUser(id: ID!): User
        getUsers: [User]

        getProduct(id: ID!): Product
        getProducts: [Product]
	}

	type Mutation {
		createUser(first_name: String!, last_name: String!, age: Int!): Boolean
        updateUser(id: ID!, first_name: String!, last_name: String!, age: Int!): Boolean
        deleteUser(id: ID!): Boolean

        createProduct(name: String!, category: String!): Boolean
        updateProduct(id: ID!, name: String!, category: String!): Boolean
        deleteProduct(id: ID!): Boolean
	}

	type Subscription {
		userCreated: User
	}

	type User {
		id: ID!
		first_name: String!
        last_name: String!
        age: Int!
	}

    type Product {
        id: ID!
        name: String!
        category: String!
    }
`;

export { typeDefs };
