import { StorageError } from './common';
import { IStorageAdapter } from './types';

export class LocalStorageAdapter implements IStorageAdapter {
	async getItem(key: string): Promise<string | null> {
		return localStorage.getItem(key);
	}

	async setItem(key: string, value: string): Promise<void> {
		try {
			localStorage.setItem(key, value);
		} catch (e) {
			if ((e as any).name === 'QuotaExceededError') {
				throw new StorageError('Local storage quota exceeded');
			}
			throw e;
		}
	}

	async removeItem(key: string): Promise<void> {
		localStorage.removeItem(key);
	}

	async contains(key: string): Promise<boolean> {
		return localStorage.getItem(key) !== null;
	}

	async clear(): Promise<void> {
		localStorage.clear();
	}

	async getAllKeys(): Promise<string[]> {
		return Object.keys(localStorage);
	}
}
