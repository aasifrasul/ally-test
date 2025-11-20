import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';
import { logger } from '../Logger';

const options = {
	host: process.env.REDIS_HOST || 'localhost',
	port: Number(process.env.REDIS_PORT) || 6379,
	retryStrategy: (times: number) => Math.min(times * 50, 2000),
};

// Separate publisher and subscriber clients (best practice)
const publisher = new Redis(options);
const subscriber = new Redis(options);

// Optional: log connection status
publisher.on('connect', () => logger.info('RedisPubSub publisher connected'));
subscriber.on('connect', () => logger.info('RedisPubSub subscriber connected'));

// Create a single shared RedisPubSub instance
export const pubsub = new RedisPubSub({
	publisher,
	subscriber,
});
