import { RedisPubSub } from 'graphql-redis-subscriptions';
import { RedisClient } from '../cachingClients/redis';
import { DBType } from '../types';
import { executeQuery, getLimitCond } from '../dbClients/helper';
import { constants } from '../constants';
import { logger } from '../Logger';

const { currentDB } = constants.dbLayer;

const pubsub = new RedisPubSub();
const redisClient = RedisClient.getInstance();

interface CRUDConfig<T> {
	model?: any; // Mongoose model
	table: string;
	eventKey: string;
	columns: string[]; // Explicit column list
	redisClient: RedisClient;
	pubsub: RedisPubSub;
	entityName?: string; // For response object keys
}

export function makeCRUDResolvers<T extends { id: string }>(config: CRUDConfig<T>) {
	const {
		model,
		table,
		eventKey,
		columns,
		redisClient,
		pubsub,
		entityName = 'entity',
	} = config;
	const selectColumns = columns.join(', ');

	return {
		async getOne(_: any, { id }: { id: string }): Promise<T | null> {
			try {
				const cached = await redisClient.get(id);
				if (cached) return cached as T;

				if (currentDB === DBType.MONGODB) {
					const item = await model.findById(id);
					if (item) await redisClient.set(id, item);
					return item;
				} else {
					const query = `SELECT ${selectColumns} FROM "${table}" WHERE id = $1`;
					const rows = await executeQuery<T>(query, [id]);
					const item = rows[0] || null;
					if (item) await redisClient.set(id, item);
					return item;
				}
			} catch (err) {
				logger.error(`Failed to get ${entityName}: ${err}`);
				return null;
			}
		},

		async getAll(_: any, args: Record<string, any> = {}): Promise<T[]> {
			try {
				const keys = Object.keys(args);

				if (currentDB === DBType.MONGODB) {
					const params = keys.length
						? keys.reduce(
								(acc, key) => {
									acc[key] = { $regex: new RegExp(`\\d*${args[key]}\\d*`) };
									return acc;
								},
								{} as Record<string, any>,
							)
						: {};
					return await model.find(params);
				} else {
					let whereClause = keys.length
						? 'WHERE ' +
							keys.map((key) => `"${key}" = '${args[key]}'`).join(' AND ')
						: getLimitCond(currentDB, 10);

					const query = `SELECT ${selectColumns} FROM "${table}" ${whereClause}`;
					return await executeQuery<T>(query);
				}
			} catch (err) {
				logger.error(`Failed to get all ${entityName}: ${err}`);
				return [];
			}
		},

		async create(
			_: any,
			args: Partial<T>,
		): Promise<{ success: boolean; [key: string]: any }> {
			try {
				let created: T;

				if (currentDB === DBType.MONGODB) {
					created = await model.create(args);
				} else {
					const keys = Object.keys(args);
					const columnList = keys.join(', ');
					const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
					const query = `INSERT INTO "${table}" (${columnList}) VALUES (${placeholders}) RETURNING *`;
					const params = Object.values(args);
					const rows = await executeQuery<T>(query, params);
					created = rows[0];
				}

				await redisClient.set(created.id, created);

				// Publish with snake_case event payload key
				const payloadKey = eventKey.toLowerCase().replace(/_/g, '');
				pubsub.publish(eventKey, { [payloadKey]: created });

				return { success: true, [entityName]: created };
			} catch (err) {
				logger.error(`Failed to create ${entityName}: ${err}`);
				return { success: false };
			}
		},

		async update(
			_: any,
			{ id, ...updates }: { id: string } & Partial<T>,
		): Promise<{ success: boolean; [key: string]: any }> {
			try {
				let updated: T | null;

				if (currentDB === DBType.MONGODB) {
					updated = await model.findByIdAndUpdate(id, updates, { new: true });
				} else {
					const keys = Object.keys(updates);
					const setClause = keys.map((key, i) => `"${key}" = $${i + 1}`).join(', ');
					const query = `UPDATE "${table}" SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
					const params = [...Object.values(updates), id];
					const rows = await executeQuery<T>(query, params);
					updated = rows[0] || null;
				}

				if (updated) await redisClient.set(id, updated);
				return { success: true, [entityName]: updated };
			} catch (err) {
				logger.error(`Failed to update ${entityName}: ${err}`);
				return { success: false };
			}
		},

		async delete(
			_: any,
			{ id }: { id: string },
		): Promise<{ success: boolean; id: string }> {
			try {
				if (currentDB === DBType.MONGODB) {
					await model.findByIdAndDelete(id);
				} else {
					const query = `DELETE FROM "${table}" WHERE id = $1`;
					await executeQuery(query, [id]);
				}

				await redisClient.delete(id);
				return { success: true, id };
			} catch (err) {
				logger.error(`Failed to delete ${entityName}: ${err}`);
				return { success: false, id };
			}
		},

		subscription: {
			subscribe: () => pubsub.asyncIterableIterator([eventKey]),
		},
	};
}
