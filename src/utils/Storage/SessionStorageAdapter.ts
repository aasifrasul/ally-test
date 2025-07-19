import { StorageError } from './common';
import { IStorageAdapter } from './types';

export class SessionStorageAdapter implements IStorageAdapter {
	async getItem(key: string): Promise<string | null> {
		return sessionStorage.getItem(key);
	}

	async setItem(key: string, value: string): Promise<void> {
		try {
			sessionStorage.setItem(key, value);
		} catch (e) {
			if ((e as any).name === 'QuotaExceededError') {
				throw new StorageError('Session storage quota exceeded');
			}
			throw e;
		}
	}

	async removeItem(key: string): Promise<void> {
		sessionStorage.removeItem(key);
	}

	async contains(key: string): Promise<boolean> {
		return sessionStorage.getItem(key) !== null;
	}

	async clear(): Promise<void> {
		sessionStorage.clear();
	}

	async getAllKeys(): Promise<string[]> {
		return Object.keys(sessionStorage);
	}
}
