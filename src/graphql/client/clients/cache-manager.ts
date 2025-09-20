import { GraphQLCache } from '../../GraphQLCache';
import { createLogger, Logger, LogLevel } from '../../../utils/Logger';

export class CacheManager {
	private cache: GraphQLCache;
	private logger: Logger;

	constructor() {
		this.cache = new GraphQLCache();
		this.logger = createLogger('CacheManager', { level: LogLevel.DEBUG });
	}

	get(query: string, variables?: any): any {
		return this.cache.get(query, variables);
	}

	set(query: string, variables: any, data: any, ttl?: number): void {
		this.cache.set(query, variables, data, ttl);
	}

	invalidate(pattern?: string): void {
		this.logger.debug('Invalidating cache', { pattern });
		this.cache.invalidate(pattern);
	}

	updateCache(query: string, variables: any, updater: (data: any) => any): void {
		this.logger.debug('Updating cache', { query: query.substring(0, 100) });
		this.cache.updateCache(query, variables, updater);
	}

	clear(): void {
		this.logger.info('Clearing all cache');
		this.cache.invalidate?.();
	}
}
