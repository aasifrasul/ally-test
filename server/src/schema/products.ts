import { DBType } from '../types';
import redisClient from '../cachingClients/redis';
import { Product } from '../models';
import { getLimitCond, getDBInstance } from './helper';
import { constants } from '../constants';
import { logger } from '../Logger';

const { currentDB } = constants.dbLayer;

let dBInstance: any;

const getProduct = async (parent: any, args: { id: string }): Promise<any> => {
	const { id } = args;

	let product = await redisClient.getCachedData(id);

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
			return false;
		}
	} else {
		dBInstance = dBInstance || (await getDBInstance(currentDB));
		const whereClause = id ? `WHERE id = ${id}` : getLimitCond(currentDB, 1);
		const query = `SELECT id, "name", "category" FROM TEST_PRODUCTS ${whereClause}`;
		const rows = await dBInstance.executeQuery(query);
		return rows[0];
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
		dBInstance = dBInstance || (await getDBInstance(currentDB));
		const keys = Object.keys(args || {});
		let whereClause = getLimitCond(currentDB, 10);
		if (keys.length) {
			whereClause =
				'WHERE ' + keys.map((key) => `"${key}" = '${args?.[key]}'`).join(' AND ');
		}
		const query = `SELECT id, "name", "category" FROM TEST_PRODUCTS ${whereClause}`;
		return await dBInstance.executeQuery(query);
	}
};

const createProduct = async (
	parent: any,
	args: { name: string; category: string },
): Promise<boolean> => {
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
		dBInstance = dBInstance || (await getDBInstance(currentDB));

		try {
			const query = `INSERT INTO TEST_PRODUCTS ("name", "category") VALUES ('${name}', '${category}')`;
			const result = await dBInstance.executeQuery(query);
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
		dBInstance = dBInstance || (await getDBInstance(currentDB));
		try {
			const query = `UPDATE TEST_PRODUCTS SET "name" = '${name}', "category" = '${category}' WHERE id = ${id}`;
			const result = await dBInstance.executeQuery(query);
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
		dBInstance = dBInstance || (await getDBInstance(currentDB));
		try {
			const query = `DELETE FROM TEST_PRODUCTS WHERE id = ${id}`;
			const result = await dBInstance.executeQuery(query);
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
 * @api {post} /graphql
 create table TEST_PRODUCTS ( id number generated always as identity, "name" varchar2(4000), "category" varchar2(4000), primary key (id));

 {
   "query": "mutation createProduct($name: String!, $category: String!) { createProduct(name: $name, category: $category) }",
   "variables": {
     "name": "ABC",
     "category": "XYZ"
   }
 }

 {
   "query": "{ getProduct(id: 1) {id, name, category} }"
 }

 {
   "query": "{ getProducts {id, name, category} }"
 }

 {
   "query": "mutation updateProduct($id: ID!, $name: String!, $category: String!) { updateProduct(id: $id, name: $name, category: $category) }",
   "variables": {
     "id": "1",
     "name": "John",
     "category": "Doe"
   }
 }

 {
   "query": "mutation deleteProduct($id: ID!) { deleteProduct(id: $id) }",
   "variables": {
     "id": "2"
   }
 }

*/
