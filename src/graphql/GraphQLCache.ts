import { createKey } from '../utils/keyGeneration';

interface CacheEntry {
	data: any;
	ttl: number;
}

export class GraphQLCache {
	private cache = new Map<string, CacheEntry>();
	private defaultTTL = 5 * 60 * 1000; // 5 minutes
	private maxSize = 100;

	private generateKey(query: string, variables?: any): string {
		return `${query}${variables ? createKey(variables) : ''}`;
	}

	private isExpired(entry: CacheEntry): boolean {
		return Date.now() > entry.ttl;
	}

	private evictOldest(): void {
		if (this.cache.size >= this.maxSize) {
			const oldestKey = this.cache.keys().next().value;
			oldestKey && this.cache.delete(oldestKey);
		}
	}

	get(query: string, variables?: any): any | null {
		const key = this.generateKey(query, variables);
		const entry = this.cache.get(key);

		if (!entry || this.isExpired(entry)) {
			this.cache.delete(key);
			return null;
		}

		// Move to end for true LRU behavior
		this.cache.delete(key);
		this.cache.set(key, entry);

		return entry.data;
	}

	set(query: string, variables: any, data: any, ttl?: number): void {
		this.evictOldest();

		const key = this.generateKey(query, variables);
		this.cache.set(key, {
			data,
			ttl: Date.now() + (ttl || this.defaultTTL),
		});
	}

	invalidate(pattern?: string): void {
		if (!pattern) {
			this.cache.clear();
			return;
		}

		// Could support regex patterns or more sophisticated matching
		const regex = new RegExp(pattern);
		for (const [key] of this.cache) {
			if (regex.test(key)) {
				this.cache.delete(key);
			}
		}
	}

	updateCache(query: string, variables: any, updater: (data: any) => any): void {
		const cached = this.get(query, variables);
		if (cached) {
			const updated = updater(cached);
			this.set(query, variables, updated);
		}
	}
}
