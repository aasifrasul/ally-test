import { CONFIG } from '../config';
import { createKey } from '../../../utils/keyGeneration';

// URL building utilities
export const buildWsUrl = (baseUrl: string): string => {
	try {
		const base = new URL(String(baseUrl));
		base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
		base.pathname = '/graphql/';
		base.search = '';
		base.hash = '';
		return base.toString();
	} catch {
		return `${(baseUrl || '').replace(/^http/, 'ws')}/graphql/`;
	}
};

// Query normalization
export const normalizeQuery = (query: string): string => {
	return query.replace(/\s+/g, ' ').trim();
};

// Cache key generation
export const generateCacheKey = (query: string, variables?: any): string => {
	const normalizedQuery = normalizeQuery(query);
	return `${normalizedQuery}${createKey(variables || {})}`;
};

// Query type detection
export const isMutation = (query: string): boolean => {
	return normalizeQuery(query).toLowerCase().startsWith('mutation');
};

// Retry delay calculation
export const calculateRetryDelay = (attempt: number): number => {
	return Math.min(
		CONFIG.RETRY_DELAYS.INITIAL * Math.pow(CONFIG.RETRY_DELAYS.EXPONENTIAL_BASE, attempt),
		CONFIG.RETRY_DELAYS.MAX,
	);
};

// WebSocket retry delay calculation
export const calculateWsRetryDelay = (retries: number): number => {
	return Math.min(
		CONFIG.RETRY_DELAYS.INITIAL * Math.pow(CONFIG.RETRY_DELAYS.EXPONENTIAL_BASE, retries),
		CONFIG.RETRY_DELAYS.WS_MAX,
	);
};

// Error type detection for retries
export const isRetryableError = (error: any): boolean => {
	const message = error.message?.toLowerCase() || '';
	return (
		message.includes('timeout') || message.includes('network') || message.includes('fetch')
	);
};

// Timeout promise utility
export const createTimeoutPromise = <T>(timeoutMs: number): Promise<T> => {
	return new Promise((_, reject) => {
		setTimeout(() => {
			reject(new Error(`Operation timed out after ${timeoutMs}ms`));
		}, timeoutMs);
	});
};
