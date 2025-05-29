import { IndexedDBStorage } from './IndexedDBStorage';
import { Keys, StorageType, StorageMapping, StorageCapacity } from './types';

// Custom error types for better error handling
class StorageError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'StorageError';
	}
}

class StorageInitializationError extends StorageError {
	constructor(message: string) {
		super(message);
		this.name = 'StorageInitializationError';
	}
}

class Storage {
	private storageType: StorageType;
	private indexedDB: IndexedDBStorage | null = null;
	private initialized: boolean = false;

	constructor(
		storageType: StorageType = StorageType.LOCAL_STORAGE,
		dbName?: string,
		storeName?: string,
	) {
		this.storageType = storageType;

		if (storageType === StorageType.INDEXED_DB && (!dbName || !storeName)) {
			throw new StorageInitializationError(
				'dbName and storeName are required for IndexedDB storage',
			);
		}

		if (!this.isStorageTypeSupported(storageType)) {
			throw new StorageInitializationError(
				`Storage type ${storageType} is not supported in this environment`,
			);
		}

		if (this.storageType === StorageType.INDEXED_DB) {
			this.indexedDB = new IndexedDBStorage(dbName!, storeName!);
		}
	}

	private isStorageTypeSupported(type: StorageType): boolean {
		switch (type) {
			case StorageType.LOCAL_STORAGE:
				return typeof window !== 'undefined' && !!window.localStorage;
			case StorageType.SESSION_STORAGE:
				return typeof window !== 'undefined' && !!window.sessionStorage;
			case StorageType.INDEXED_DB:
				return typeof window !== 'undefined' && !!window.indexedDB;
			default:
				return false;
		}
	}

	private getStorageMapping(): StorageMapping {
		if (!this.initialized) {
			throw new StorageError('Storage not initialized. Call initialize() first.');
		}

		switch (this.storageType) {
			case StorageType.LOCAL_STORAGE:
				return {
					stringify: true,
					getItem: async (key) => localStorage.getItem(key),
					setItem: async (key, value) => {
						try {
							localStorage.setItem(key, value);
						} catch (e) {
							if ((e as any).name === 'QuotaExceededError') {
								throw new StorageError('Local storage quota exceeded');
							}
							throw e;
						}
					},
					removeItem: async (key) => localStorage.removeItem(key),
					contains: async (key) => localStorage.getItem(key) !== null,
					clear: async () => localStorage.clear(),
					keys: async () => Object.keys(localStorage),
				};
			case StorageType.SESSION_STORAGE:
				return {
					stringify: true,
					getItem: async (key) => sessionStorage.getItem(key),
					setItem: async (key, value) => {
						try {
							sessionStorage.setItem(key, value);
						} catch (e) {
							if ((e as any).name === 'QuotaExceededError') {
								throw new StorageError('Session storage quota exceeded');
							}
							throw e;
						}
					},
					removeItem: async (key) => sessionStorage.removeItem(key),
					contains: async (key) => sessionStorage.getItem(key) !== null,
					clear: async () => sessionStorage.clear(),
					keys: async () => Object.keys(sessionStorage),
				};

			case StorageType.INDEXED_DB:
				return {
					stringify: false,
					getItem: async (key) => this.indexedDB!.getItem(key),
					setItem: async (key, value) => this.indexedDB!.setItem(key, value),
					removeItem: async (key) => this.indexedDB!.removeItem(key),
					contains: async (key) => this.indexedDB!.contains(key),
					clear: async () => this.indexedDB!.clear(),
					keys: async () => this.indexedDB!.getAllKeys(),
				};
			default:
				throw new StorageError('Unsupported storage type');
		}
	}

	async initialize(): Promise<void> {
		if (this.initialized) return;

		if (this.storageType === StorageType.INDEXED_DB) {
			try {
				await this.indexedDB!.initialize();
				this.initialized = true;
			} catch (e) {
				throw new StorageInitializationError(
					`Failed to initialize IndexedDB: ${(e as Error).message}`,
				);
			}
		} else {
			this.initialized = true;
		}
	}

	async getItem<T>(key: string): Promise<T | null> {
		const storage = this.getStorageMapping();
		try {
			const data = await storage.getItem(key);
			if (data === null || data === undefined) return null;
			return storage.stringify ? JSON.parse(data) : data;
		} catch (e) {
			throw new StorageError(`Error getting item: ${(e as Error).message}`);
		}
	}

	async setItem<T>(key: string, value: T): Promise<void> {
		const storage = this.getStorageMapping();
		try {
			const dataToStore = storage.stringify ? JSON.stringify(value) : value;
			await storage.setItem(key, dataToStore);
		} catch (e) {
			throw new StorageError(`Error setting item: ${(e as Error).message}`);
		}
	}

	async removeItem(key: string): Promise<void> {
		const storage = this.getStorageMapping();
		try {
			await storage.removeItem(key);
		} catch (e) {
			throw new StorageError(`Error removing item: ${(e as Error).message}`);
		}
	}

	async contains(key: string): Promise<boolean> {
		const storage = this.getStorageMapping();
		return storage.contains(key);
	}

	async clear(): Promise<void> {
		const storage = this.getStorageMapping();
		try {
			await storage.clear();
		} catch (e) {
			throw new StorageError(`Error clearing storage: ${(e as Error).message}`);
		}
	}

	async getAllKeys(): Promise<Keys> {
		const storage = this.getStorageMapping();
		try {
			return await storage.keys();
		} catch (e) {
			throw new StorageError(`Error getting keys: ${(e as Error).message}`);
		}
	}

	async getStorageCapacity(): Promise<StorageCapacity | null> {
		if (
			this.storageType === StorageType.LOCAL_STORAGE ||
			this.storageType === StorageType.SESSION_STORAGE
		) {
			try {
				const quota = (await navigator?.storage?.estimate()) || null;
				if (!quota) return null;

				return {
					used: quota.usage || 0,
					total: quota.quota || 0,
					available: (quota.quota || 0) - (quota.usage || 0),
				};
			} catch {
				return null;
			}
		}
		return null;
	}

	close(): void {
		if (this.storageType === StorageType.INDEXED_DB && this.indexedDB) {
			this.indexedDB.close();
		}
		this.initialized = false;
	}
}

export { Storage, StorageType, StorageError, StorageInitializationError };
