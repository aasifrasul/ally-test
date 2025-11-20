import { RedisPubSub } from 'graphql-redis-subscriptions';
import { RedisClient } from '../../cachingClients/redis';
import { logger } from '../../Logger';

export interface IRepository<T> {
	findById(id: string): Promise<T | undefined>;
	create(data: T): Promise<T>;
	updateById(id: string, updates: Partial<T>): Promise<T | undefined>;
	deleteById(id: string): Promise<T | undefined>;
}

export function makeCRUDResolvers<T extends { id: string }>(config: {
	repo: IRepository<T>;
	eventKey: string;
	redisClient?: RedisClient;
	pubsub?: RedisPubSub;
	entityName?: string;
}) {
	const { repo, eventKey, redisClient, pubsub, entityName = 'entity' } = config;

	return {
		Query: {
			async getOne(_: any, { id }: { id: string }) {
				try {
					if (redisClient) {
						const cached = await redisClient.get(id);
						if (cached) return cached;
					}

					const item = await repo.findById(id);
					if (item && redisClient) await redisClient.set(id, item);
					return item;
				} catch (err) {
					logger.error(`Failed to get ${entityName}: ${err}`);
					return null;
				}
			},
		},
		Mutation: {
			async create(_: any, args: T) {
				try {
					const created = await repo.create(args);
					if (redisClient) await redisClient.set(created.id, created);
					if (pubsub)
						pubsub.publish(eventKey, { [eventKey.toLowerCase()]: created });
					return { success: true, [entityName]: created };
				} catch (err) {
					logger.error(`Failed to create ${entityName}: ${err}`);
					return { success: false };
				}
			},
			async update(_: any, { id, ...updates }: { id: string } & Partial<T>) {
				try {
					const updated = await repo.updateById(id, updates as Partial<T>);
					if (updated && redisClient) await redisClient.set(id, updated);
					return { success: !!updated, [entityName]: updated };
				} catch (err) {
					logger.error(`Failed to update ${entityName}: ${err}`);
					return { success: false };
				}
			},
			async delete(_: any, { id }: { id: string }) {
				try {
					await repo.deleteById(id);
					if (redisClient) await redisClient.delete(id);
					return { success: true, id };
				} catch (err) {
					logger.error(`Failed to delete ${entityName}: ${err}`);
					return { success: false, id };
				}
			},
		},
		Subscription: {
			[eventKey]: {
				subscribe: () => pubsub?.asyncIterator([eventKey]),
			},
		},
	};
}
