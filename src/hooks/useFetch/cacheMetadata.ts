import { Schema } from '../../constants/types';

const schemaMeta = new Map<Schema, { lastFetchedAt?: number }>();

export function isSchemaStale(schema: Schema, staleTime: number): boolean {
	if (!staleTime) return true;

	const lastFetchedAt = schemaMeta.get(schema)?.lastFetchedAt;
	return !lastFetchedAt || Date.now() - lastFetchedAt > staleTime;
}

export function markSchemaFetched(schema: Schema): void {
	schemaMeta.set(schema, { lastFetchedAt: Date.now() });
}

export function invalidateSchema(schema: Schema): void {
	schemaMeta.delete(schema);
}
