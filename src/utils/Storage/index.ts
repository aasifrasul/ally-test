import { LocalStorageAdapter } from './LocalStorageAdapter';
import { SessionStorageAdapter } from './SessionStorageAdapter';
import { IndexedDBAdapter } from './IndexedDBAdapter';
import { Keys, StorageType, StorageCapacity, IStorageAdapter } from './types';
import { StorageError, StorageInitializationError } from './common';

class Storage {
	private storageAdapter: IStorageAdapter;
	private needsStringify: boolean;
	private initialized: boolean = false;

	constructor(
		storageType: StorageType = StorageType.LOCAL_STORAGE,
		dbName?: string,
		storeName?: string,
	) {
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

		// Create the appropriate adapter
		switch (storageType) {
			case StorageType.LOCAL_STORAGE:
				this.storageAdapter = new LocalStorageAdapter();
				this.needsStringify = true;
				break;
			case StorageType.SESSION_STORAGE:
				this.storageAdapter = new SessionStorageAdapter();
				this.needsStringify = true;
				break;
			case StorageType.INDEXED_DB:
				this.storageAdapter = new IndexedDBAdapter(dbName!, storeName!);
				this.needsStringify = false;
				break;
			default:
				throw new StorageInitializationError(
					`Unsupported storage type: ${storageType}`,
				);
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

	async initialize(): Promise<void> {
		if (this.initialized) return;

		if (this.storageAdapter.initialize) {
			try {
				await this.storageAdapter.initialize();
			} catch (e) {
				throw new StorageInitializationError(
					`Failed to initialize storage: ${(e as Error).message}`,
				);
			}
		}
		this.initialized = true;
	}

	async getItem<T>(key: string): Promise<T | null> {
		if (!this.initialized) {
			throw new StorageError('Storage not initialized. Call initialize() first.');
		}

		try {
			const data = await this.storageAdapter.getItem(key);
			if (data === null || data === undefined) return null;
			return this.needsStringify ? JSON.parse(data) : data;
		} catch (e) {
			throw new StorageError(`Error getting item: ${(e as Error).message}`);
		}
	}

	async setItem<T>(key: string, value: T): Promise<void> {
		if (!this.initialized) {
			throw new StorageError('Storage not initialized. Call initialize() first.');
		}

		try {
			const dataToStore = this.needsStringify ? JSON.stringify(value) : value;
			await this.storageAdapter.setItem(key, dataToStore);
		} catch (e) {
			throw new StorageError(`Error setting item: ${(e as Error).message}`);
		}
	}

	async removeItem(key: string): Promise<void> {
		if (!this.initialized) {
			throw new StorageError('Storage not initialized. Call initialize() first.');
		}

		try {
			await this.storageAdapter.removeItem(key);
		} catch (e) {
			throw new StorageError(`Error removing item: ${(e as Error).message}`);
		}
	}

	async contains(key: string): Promise<boolean> {
		if (!this.initialized) {
			throw new StorageError('Storage not initialized. Call initialize() first.');
		}

		return this.storageAdapter.contains(key);
	}

	async clear(): Promise<void> {
		if (!this.initialized) {
			throw new StorageError('Storage not initialized. Call initialize() first.');
		}

		try {
			await this.storageAdapter.clear();
		} catch (e) {
			throw new StorageError(`Error clearing storage: ${(e as Error).message}`);
		}
	}

	async getAllKeys(): Promise<Keys> {
		if (!this.initialized) {
			throw new StorageError('Storage not initialized. Call initialize() first.');
		}

		try {
			return await this.storageAdapter.getAllKeys();
		} catch (e) {
			throw new StorageError(`Error getting keys: ${(e as Error).message}`);
		}
	}

	async getStorageCapacity(): Promise<StorageCapacity | null> {
		// This method remains the same as it's specific to web storage APIs
		if (this.needsStringify) {
			// LocalStorage or SessionStorage
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
		if (this.storageAdapter.close) {
			this.storageAdapter.close();
		}
		this.initialized = false;
	}
}

export { Storage, StorageType, StorageError, StorageInitializationError };
