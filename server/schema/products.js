const {
	GraphQLObjectType,
	GraphQLString,
	GraphQLID,
	GraphQLList,
	GraphQLNonNull,
	GraphQLBoolean,
} = require('graphql');

const { getLimitCond } = require('./helper');
const GenericDBConnection = require('../dbClients/GenericDBConnection');
const { logger } = require('../Logger');

let dBInstance;

GenericDBConnection.getInstance('postgresql').then((genericInstance) => {
	dBInstance = genericInstance.getDBInstance();
});

const ProductType = new GraphQLObjectType({
	name: 'Products',
	fields: () => ({
		id: { type: GraphQLID },
		name: { type: GraphQLString },
		category: { type: GraphQLString },
	}),
});

const getProduct = {
	type: ProductType,
	args: {
		id: { type: GraphQLID },
	},
	resolve: async (parent, args) => {
		const whereClause = args.id
			? `WHERE "id" = ${args.id}`
			: getLimitCond('postgresql', 1);
		const query = `SELECT "id", "name", "category" FROM TEST_PRODUCTS ${whereClause}`;
		const rows = await dBInstance.executeQuery(query);
		return rows[0];
	},
};

const getProducts = {
	type: new GraphQLList(ProductType),
	args: {
		id: { type: GraphQLID },
		name: { type: GraphQLString },
		category: { type: GraphQLString },
	},
	resolve: async (parent, args) => {
		const keys = Object.keys(args);
		let whereClause = getLimitCond('postgresql', 10);
		if (keys.length) {
			whereClause =
				'WHERE ' + keys.map((key) => `"${key}" = '${args[key]}'`).join(' AND ');
		}
		const query = `SELECT "id", "name", "category" FROM TEST_PRODUCTS ${whereClause}`;
		return await dBInstance.executeQuery(query);
	},
};

const createProduct = {
	type: new GraphQLNonNull(GraphQLBoolean),
	args: {
		name: { type: new GraphQLNonNull(GraphQLString) },
		category: { type: new GraphQLNonNull(GraphQLString) },
	},
	resolve: async (parent, args) => {
		try {
			const { name, category } = args;
			const query = `INSERT INTO TEST_PRODUCTS ("name", "category") VALUES ('${name}', '${category}')`;
			const result = await dBInstance.executeQuery(query);
			logger.info(result);
			return true;
		} catch (error) {
			logger.error(`Failed to create product ${error}`);
		}
	},
};

const updateProduct = {
	type: new GraphQLNonNull(GraphQLBoolean),
	args: {
		id: { type: new GraphQLNonNull(GraphQLID) },
		name: { type: GraphQLString },
		category: { type: GraphQLString },
	},
	resolve: async (parent, args) => {
		try {
			const { id, name, category } = args;
			const query = `UPDATE TEST_PRODUCTS SET "name" = '${name}', "category" = '${category}' WHERE "id" = ${id}`;
			const result = await dBInstance.executeQuery(query);
			logger.info(result);
			return true;
		} catch (error) {
			logger.error(`Failed to update product ${error}`);
		}
	},
};

const deleteProduct = {
	type: new GraphQLNonNull(GraphQLBoolean),
	args: {
		id: { type: new GraphQLNonNull(GraphQLID) },
	},
	resolve: async (parent, args) => {
		try {
			const query = `DELETE FROM TEST_PRODUCTS WHERE "id" = ${args.id}`;
			const result = await dBInstance.executeQuery(query);
			logger.info(result);
			return true;
		} catch (error) {
			logger.error(`Failed to DELETE product with id ${args.id} ${error}`);
		}
	},
};

module.exports = { getProduct, getProducts, createProduct, updateProduct, deleteProduct };

/**
 * create table TEST_PRODUCTS ( "id" number generated always as identity, "name" varchar2(4000), "category" varchar2(4000), primary key ("id"));
 * 
 * {
 "query": "mutation createProduct($name: String!, $category: String!) { createProduct(name: $name, category: $category) }",
 "variables": {
   "name": "ABC",
   "category": "XYZ",
 }
}
 * 
 * {
  "query": "{ getProduct(id: 1) {id, name, category} }"
}
 * 
 * 
 * {
  "query": "{ getProducts {id, name, category} }"
}
 * 
 * 
 * {
 "query": "mutation UpdateProduct($id: ID!, $name: String, $category: String) { updateProduct(id: $id, name: $name, category: $category) }",
 "variables": {
   "id": "1",
   "name": "John",
   "category": "Doe"
 }
}
 * 
 * 
 * 
 * {
 "query": "mutation deleteProduct($id: ID!) { deleteProduct(id: $id) }",
 "variables": {
   "id": "2"
 }
}
 * 
 * 
*/
