export const typeDefs = `
	type Query {
		getUser(id: ID!): User
		getUsers: [User]
		getProduct(id: ID!): Product
		getProducts: [Product]
		getBook(id: ID!): Book
		getBooks: [Book]
	}

	type Mutation {
		createUser(first_name: String!, last_name: String!, age: Int!): UserResult
		updateUser(id: ID!, first_name: String!, last_name: String!, age: Int!): UserResult
		deleteUser(id: ID!): DeleteResult

		createProduct(name: String!, category: String!): ProductResult
		updateProduct(id: ID!, name: String!, category: String!): ProductResult
		deleteProduct(id: ID!): DeleteResult

		addBook(title: String!, author: String!, issued: Boolean!): BookMutationResponse
		updateBook(id: ID!, title: String, author: String, issued: Boolean): BookMutationResponse
		deleteBook(id: ID!): DeleteResult
	}

	type Subscription {
		userCreated: User
		bookCreated: Book
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

	type Book {
		id: ID!
		title: String!
		author: String!
		issued: Boolean!
	}

	type UserResult {
		success: Boolean!
		message: String
		user: User
	}

	type ProductResult {
		success: Boolean!
		message: String
		product: Product
	}

	type BookMutationResponse {
		success: Boolean!
		message: String
		book: Book
	}

	type DeleteResult {
		success: Boolean!
		message: String
		id: ID
	}
`;
