import { generateCacheKey } from './index';

class RequestDeduplicator {
	private pendingQueries = new Map<string, Promise<any>>();

	hasPendingRequest(query: string, variables?: any): boolean {
		const cacheKey = generateCacheKey(query, variables);
		return this.pendingQueries.has(cacheKey);
	}

	getPendingRequest<T = any>(query: string, variables?: any): Promise<T> | undefined {
		const cacheKey = generateCacheKey(query, variables);
		return this.pendingQueries.get(cacheKey);
	}

	addPendingRequest<T = any>(
		query: string,
		variables: any,
		promise: Promise<T>,
	): Promise<T> {
		const cacheKey = generateCacheKey(query, variables);
		this.pendingQueries.set(cacheKey, promise);

		// Clean up when promise resolves/rejects
		promise.finally(() => {
			this.pendingQueries.delete(cacheKey);
		});

		return promise;
	}

	removePendingRequest(query: string, variables?: any): void {
		const cacheKey = generateCacheKey(query, variables);
		this.pendingQueries.delete(cacheKey);
	}

	clear(): void {
		this.pendingQueries.clear();
	}

	size(): number {
		return this.pendingQueries.size;
	}
}

export const requestDeduplicator = new RequestDeduplicator();
