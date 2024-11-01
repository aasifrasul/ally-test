import { IndexedDBStorage } from './IndexedDBStorage';

import { StorageType, StorageMapping } from './types';

export class Storage {
	private storageType: StorageType;
	private hashMap: Map<string, any> | null = null;
	private indexedDB: IndexedDBStorage | null = null;

	constructor(
		storageType: StorageType = StorageType.LOCAL_STORAGE,
		dbName?: string,
		storeName?: string,
	) {
		this.storageType = storageType;

		if (this.storageType === StorageType.MAP) {
			this.hashMap = new Map();
		} else if (this.storageType === StorageType.INDEXED_DB) {
			this.indexedDB = new IndexedDBStorage(dbName, storeName);
		}
	}

	private getStorageMapping(): StorageMapping {
		switch (this.storageType) {
			case StorageType.LOCAL_STORAGE:
				return {
					stringify: true,
					getItem: async (key) => localStorage.getItem(key),
					setItem: async (key, value) => localStorage.setItem(key, value),
					removeItem: async (key) => localStorage.removeItem(key),
					contains: async (key) => localStorage.getItem(key) !== null,
				};
			case StorageType.SESSION_STORAGE:
				return {
					stringify: true,
					getItem: async (key) => sessionStorage.getItem(key),
					setItem: async (key, value) => sessionStorage.setItem(key, value),
					removeItem: async (key) => sessionStorage.removeItem(key),
					contains: async (key) => sessionStorage.getItem(key) !== null,
				};
			case StorageType.MAP:
				return {
					getItem: async (key) => this.hashMap!.get(key),
					setItem: async (key, value) => {
						this.hashMap!.set(key, value);
						return Promise.resolve();
					},
					removeItem: async (key) => {
						this.hashMap!.delete(key);
						return Promise.resolve();
					},
					contains: async (key) => this.hashMap!.has(key),
				};
			case StorageType.INDEXED_DB:
				return {
					getItem: async (key) => this.indexedDB!.getItem(key),
					setItem: async (key, value) => this.indexedDB!.setItem(key, value),
					removeItem: async (key) => this.indexedDB!.removeItem(key),
					contains: async (key) => this.indexedDB!.contains(key),
				};
			default:
				throw new Error('Unsupported storage type');
		}
	}

	async getItem<T>(key: string): Promise<T | null> {
		const storage = this.getStorageMapping();
		try {
			const data = await storage.getItem(key);
			if (data === null || data === undefined) return null;
			return storage.stringify ? JSON.parse(data) : data;
		} catch (e) {
			throw new Error(`Error getting item: ${e}`);
		}
	}

	async setItem(key: string, value: any): Promise<void> {
		const storage = this.getStorageMapping();
		try {
			const dataToStore = storage.stringify ? JSON.stringify(value) : value;
			await storage.setItem(key, dataToStore);
		} catch (e) {
			throw new Error(`Error setting item: ${e}`);
		}
	}

	async removeItem(key: string): Promise<void> {
		const storage = this.getStorageMapping();
		try {
			await storage.removeItem(key);
		} catch (e) {
			throw new Error(`Error removing item: ${e}`);
		}
	}

	async contains(key: string): Promise<boolean> {
		const storage = this.getStorageMapping();
		return storage.contains(key);
	}

	close(): void {
		if (this.storageType === StorageType.INDEXED_DB && this.indexedDB) {
			this.indexedDB.close();
		}
	}
}

// Example usage:
// const storage = new Storage('indexedDB', 'myCustomDB', 'myCustomStore');
// await storage.setItem('user1', { name: 'John Doe', age: 30 });
// const user = await storage.getItem('user1');
// await storage.removeItem('user1');
// storage.close();
