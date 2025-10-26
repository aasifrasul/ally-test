export interface IDBAdapter {
	find<T>(collection: string, filter: any): Promise<T[]>;
	findOne<T>(collection: string, filter: any): Promise<T | null>;
	insert<T>(collection: string, data: any): Promise<T>;
	update(collection: string, filter: any, data: any): Promise<number>;
	delete(collection: string, filter: any): Promise<number>;
	checkHealth(): Promise<boolean>;
	cleanup(): Promise<void>;
}

export interface IDBConnection {
	executeQuery<T = any>(query: string, params?: any[]): Promise<T[]>;
	checkHealth(): Promise<boolean>;
	cleanup(): Promise<void>;
}
