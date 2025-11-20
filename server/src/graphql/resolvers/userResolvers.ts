import { makeCRUDResolvers } from './makeCRUDResolvers';
import { userRepo } from '../../DAL/userRepo';
import { RedisClient } from '../../cachingClients/redis';
import { pubsub } from '../../pubsub';

const redisClient = RedisClient.getInstance();

export const userResolvers = makeCRUDResolvers({
	repo: userRepo as any,
	eventKey: 'USER_UPDATED',
	redisClient,
	pubsub,
	entityName: 'user',
});
