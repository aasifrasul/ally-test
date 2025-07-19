import { IndexedDBStorage } from './IndexedDBStorage';
import { IStorageAdapter } from './types';

export class IndexedDBAdapter implements IStorageAdapter {
	private indexedDB: IndexedDBStorage;

	constructor(dbName: string, storeName: string) {
		this.indexedDB = new IndexedDBStorage(dbName, storeName);
	}

	async initialize(): Promise<void> {
		await this.indexedDB.initialize();
	}

	async getItem(key: string): Promise<any> {
		return this.indexedDB.getItem(key);
	}

	async setItem(key: string, value: any): Promise<void> {
		return this.indexedDB.setItem(key, value);
	}

	async removeItem(key: string): Promise<void> {
		return this.indexedDB.removeItem(key);
	}

	async contains(key: string): Promise<boolean> {
		return this.indexedDB.contains(key);
	}

	async clear(): Promise<void> {
		return this.indexedDB.clear();
	}

	async getAllKeys(): Promise<string[]> {
		return this.indexedDB.getAllKeys() as unknown as string[];
	}

	close(): void {
		this.indexedDB.close();
	}
}
