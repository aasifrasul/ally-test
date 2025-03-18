import { DBType } from '../types';
import { RedisClient } from '../cachingClients/redis';
import { Product } from '../models';
import { GenericDBConnection, getLimitCond, getGenericDBInstance } from '../dbClients/helper';
import { constants } from '../constants';
import { logger } from '../Logger';

interface ProductArgs {
	id?: string;
	name: string;
	category: string;
}

const { currentDB } = constants.dbLayer;

let genericDBInstance: GenericDBConnection;
const redisClient = RedisClient.getInstance();
redisClient.connect();

const table = 'TEST_PRODUCTS';

const getProduct = async (parent: any, args: { id: string }): Promise<ProductArgs | null> => {
	const { id } = args;

	let product: ProductArgs | null = await redisClient.getCachedData(id);

	if (product) {
		return product;
	}

	if (currentDB === DBType.MONGODB) {
		try {
			product = await Product.findById(id);
			redisClient.cacheData(id, product);
			return product;
		} catch (error) {
			logger.error(`Failed to create product in MongoDB: ${error}`);
			return null;
		}
	} else {
		genericDBInstance = await getGenericDBInstance(currentDB);
		const whereClause = id ? `WHERE id = ${id}` : getLimitCond(currentDB, 1);
		const query = `SELECT id, "name", "category" FROM ${table} ${whereClause}`;
		const rows: ProductArgs[] = await genericDBInstance.executeQuery(query);
		return rows[0] || null;
	}
};

const getProducts = async (parent: any, args?: { [key: string]: any }): Promise<any[]> => {
	if (currentDB === DBType.MONGODB) {
		try {
			const products = await Product.find(args || {});
			return products;
		} catch (error) {
			logger.error(`Failed to create product in MongoDB: ${error}`);
			return [];
		}
	} else {
		genericDBInstance = await getGenericDBInstance(currentDB);
		const keys = Object.keys(args || {});
		let whereClause = getLimitCond(currentDB, 10);
		if (keys.length) {
			whereClause =
				'WHERE ' + keys.map((key) => `"${key}" = '${args?.[key]}'`).join(' AND ');
		}
		const query = `SELECT id, "name", "category" FROM ${table} ${whereClause}`;
		return await genericDBInstance.executeQuery(query);
	}
};

const createProduct = async (parent: any, args: ProductArgs): Promise<boolean> => {
	const { name, category } = args;

	if (currentDB === DBType.MONGODB) {
		try {
			const product = await new Product({ name, category }).save();
			redisClient.cacheData(product.id, product);
			return true;
		} catch (error) {
			logger.error(`Failed to create product in MongoDB: ${error}`);
			return false;
		}
	} else {
		try {
			genericDBInstance = await getGenericDBInstance(currentDB);
			const query = `INSERT INTO ${table} ("name", "category") VALUES ('${name}', '${category}')`;
			const result = await genericDBInstance.executeQuery(query);
			logger.info(result);
			return true;
		} catch (error) {
			logger.error(`Failed to create product ${error}`);
			return false;
		}
	}
};

const updateProduct = async (
	parent: any,
	args: { id: string; name: string; category: string },
): Promise<boolean> => {
	const { id, name, category } = args;

	if (currentDB === DBType.MONGODB) {
		try {
			const product = await Product.findByIdAndUpdate(
				id,
				{ name, category },
				{ new: true },
			);
			redisClient.cacheData(id, product);
			return true;
		} catch (error) {
			logger.error(`Failed to create product in MongoDB: ${error}`);
			return false;
		}
	} else {
		try {
			genericDBInstance = await getGenericDBInstance(currentDB);
			const query = `UPDATE ${table} SET "name" = '${name}', "category" = '${category}' WHERE id = ${id}`;
			const result = await genericDBInstance.executeQuery(query);
			logger.info(result);
			return true;
		} catch (error) {
			logger.error(`Failed to update product ${error}`);
			return false;
		}
	}
};

const deleteProduct = async (parent: any, args: { id: string }): Promise<boolean> => {
	const { id } = args;

	if (currentDB === 'mongodb') {
		try {
			await Product.findByIdAndDelete(id, { new: true });
			redisClient.deleteCachedData(id);
			return true;
		} catch (error) {
			logger.error(`Failed to create product in MongoDB: ${error}`);
			return false;
		}
	} else {
		try {
			genericDBInstance = await getGenericDBInstance(currentDB);
			const query = `DELETE FROM ${table} WHERE id = ${id}`;
			const result = await genericDBInstance.executeQuery(query);
			logger.info(result);
			return true;
		} catch (error) {
			logger.error(`Failed to DELETE product with id ${id} ${error}`);
			return false;
		}
	}
};

export { getProduct, getProducts, createProduct, updateProduct, deleteProduct };

/**
 * Oracle
 * create table TEST_PRODUCTS ( id number generated always as identity, "name" varchar2(4000), "category" varchar2(4000), primary key (id));
 * 
 * PGSQL
 * CREATE TABLE "TEST_PRODUCTS" (
    id SERIAL PRIMARY KEY,  -- SERIAL is a convenient way to create an auto-incrementing integer primary key
    name VARCHAR(4000), -- VARCHAR is the correct type, and length is specified in parentheses
    category VARCHAR(4000)  -- VARCHAR is the correct type, and length is specified in parentheses
);
 * 
{
 "query": "mutation createProduct($name: String!, $category: String!) { createProduct(name: $name, category: $category) }",
 "variables": {
   "name": "ABC",
   "category": "XYZ"
 }
}
 * 
{
  "query": "{ getProduct(id: 1) {id, name, category} }"
}
 * 
 * 
{
  "query": "{ getProducts {id, name, category} }"
}
 * 
 * 
 * {
 "query": "mutation updateProduct($id: ID!, $name: String!, $category: String!) { updateProduct(id: $id, name: $name, category: $category) }",
 "variables": {
   "id": "1",
   "name": "John",
   "category": "Doe"
 }
}
 * 
 * 
 * 
{
 "query": "mutation deleteProduct($id: ID!) { deleteProduct(id: $id) }",
 "variables": {
   "id": "2"
 }
}
 * 
 * 
*/
