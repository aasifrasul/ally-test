import { DBType, IProduct } from '../types';
import { RedisClient } from '../cachingClients/redis';
import { Product } from '../models';
import { getLimitCond, executeQuery } from '../dbClients/helper';
import { constants } from '../constants';
import { logger } from '../Logger';

interface ProductArgs {
	id?: string;
	name: string;
	category: string;
}

type ProductResult = {
	success: Boolean
	message?: String
	product?: IProduct | null
}

type DeleteResult = {
	success: Boolean
	message?: String
	id: String
}

const { currentDB } = constants.dbLayer;

const redisClient = RedisClient.getInstance();
redisClient.connect();

const table = '"TEST_PRODUCTS"';

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
		const whereClause = id ? `WHERE id = $1` : getLimitCond(currentDB, 1);
		const query = `SELECT id, "name", "category" FROM ${table} ${whereClause}`;
		const rows: ProductArgs[] = await executeQuery(query, [id]);
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
		const keys = Object.keys(args || {});
		let whereClause = getLimitCond(currentDB, 10);
		if (keys.length) {
			whereClause =
				'WHERE ' + keys.map((key) => `"${key}" = '${args?.[key]}'`).join(' AND ');
		}
		const query = `SELECT id, "name", "category" FROM ${table} ${whereClause}`;
		return await executeQuery(query);
	}
};

const createProduct = async (parent: any, args: ProductArgs): Promise<ProductResult> => {
	const { name, category } = args;

	if (currentDB === DBType.MONGODB) {
		try {
			const product = await new Product({ name, category }).save();
			redisClient.cacheData(product.id, product);
			return { success: true, product };
		} catch (error) {
			logger.error(`Failed to create product in MongoDB: ${error}`);
			return { success: false };
		}
	} else {
		try {
			const query = `INSERT INTO ${table} ("name", "category") VALUES ($1, $2) RETURNING *`;
			const params = [name, category]
			const result = await executeQuery<IProduct>(query, params);
			logger.info(result);
			return { success: true, product: result[0] };
		} catch (error) {
			logger.error(`Failed to create product ${error}`);
			return { success: false };
		}
	}
};

const updateProduct = async (
	parent: any,
	args: { id: string; name: string; category: string },
): Promise<ProductResult> => {
	const { id, name, category } = args;

	if (currentDB === DBType.MONGODB) {
		try {
			const product = await Product.findByIdAndUpdate(
				id,
				{ name, category },
				{ new: true },
			);
			redisClient.cacheData(id, product);
			return { success: true, product };
		} catch (error) {
			logger.error(`Failed to create product in MongoDB: ${error}`);
			return { success: false };
		}
	} else {
		try {
			const query = `UPDATE ${table} SET "name" = $1, "category" = $2 WHERE id = $3 RETURNING *`;
			const params = [name, category, id]
			const result = await executeQuery<IProduct>(query, params);
			logger.info(result);
			return { success: true, product: result[0] };
		} catch (error) {
			logger.error(`Failed to update product ${error}`);
			return { success: false };
		}
	}
};

const deleteProduct = async (parent: any, args: { id: string }): Promise<DeleteResult> => {
	const { id } = args;

	if (currentDB === 'mongodb') {
		try {
			await Product.findByIdAndDelete(id, { new: true });
			redisClient.deleteCachedData(id);
			return { success: false, id };
		} catch (error) {
			logger.error(`Failed to create product in MongoDB: ${error}`);
			return { success: false, id };
		}
	} else {
		try {
			const query = `DELETE FROM ${table} WHERE id = $1`;
			const result = await executeQuery(query, [id]);
			logger.info(result);
			return { success: true, id };
		} catch (error) {
			logger.error(`Failed to DELETE product with id ${id} ${error}`);
			return { success: false, id };
		}
	}
};

export { getProduct, getProducts, createProduct, updateProduct, deleteProduct };

/**
 * Oracle
 * create table TEST_PRODUCTS ( id number generated always as identity, "name" varchar2(4000), "category" varchar2(4000), primary key (id));
 * 
 * PGSQL
 * 
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE "TEST_PRODUCTS" (
	id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
	name VARCHAR(4000), -- VARCHAR is the correct type, and length is specified in parentheses
	category VARCHAR(4000)  -- VARCHAR is the correct type, and length is specified in parentheses
);
 * 
{
 "query": "mutation createProduct($name: String!, $category: String!) { createProduct(name: $name, category: $category) { success message product { id name category } } }",
 "variables": {
	 "name": "ABC",
	 "category": "XYZ"
 }
}
 * 
{
	"query": "{ getProduct(id: \"402e856f-6cf1-49e6-8735-f49b7502cd59\") {id, name, category} }"
}
 * 
 * 
{
	"query": "{ getProducts {id, name, category} }"
}
 * 
 * 
 * {
 "query": "mutation updateProduct($id: ID!, $name: String!, $category: String!) { updateProduct(id: $id, name: $name, category: $category) { success message product { id name category } } }",
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
 "query": "mutation deleteProduct($id: ID!) { deleteProduct(id: $id) { success message id } }",
 "variables": {
	 "id": "2"
 }
}
 * 
 * 
*/
