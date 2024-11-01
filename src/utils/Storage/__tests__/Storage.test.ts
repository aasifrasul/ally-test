import { Storage } from '..';

import {
	mockIndexedDBOpen,
	mockIDBRequest,
	indexedDB,
	mockIndexedDBOperation,
	mockIDBObjectStore,
} from './mocks';
import { StorageType } from '../types';

describe('Storage', () => {
	let storage: Storage;

	beforeEach(() => {
		localStorage.clear();
		sessionStorage.clear();
		jest.clearAllMocks();
		(global as any).indexedDB = indexedDB;
		mockIndexedDBOpen();
	});

	const testStorageOperations = (storageType: StorageType) => {
		describe(storageType, () => {
			beforeEach(() => {
				storage = new Storage(storageType);
				if (storageType === StorageType.INDEXED_DB) {
					mockIndexedDBOpen();
				}
			});

			test('setItem and getItem', async () => {
				if (storageType === StorageType.INDEXED_DB) {
					mockIndexedDBOperation('put');
					mockIndexedDBOperation('get');
				}
				await storage.setItem('key', 'value');
				const result = await storage.getItem('key');
				expect(result).toBe('value');
			});

			test('removeItem', async () => {
				if (storageType === StorageType.INDEXED_DB) {
					mockIndexedDBOperation('put');
					mockIndexedDBOperation('delete');
					mockIndexedDBOperation('get');
				}
				await storage.setItem('key', 'value');
				await storage.removeItem('key');
				const result = await storage.getItem('key');
				expect(result).toBeNull();
			});

			test('contains', async () => {
				if (storageType === StorageType.INDEXED_DB) {
					mockIndexedDBOperation('put');
					mockIndexedDBOperation('get');
				}
				await storage.setItem('key', 'value');
				expect(await storage.contains('key')).toBe(true);
				if (storageType === StorageType.INDEXED_DB) {
					mockIDBObjectStore.get.mockReturnValue({
						...mockIDBRequest,
						addEventListener: jest.fn((event, callback) => {
							if (event === 'success') callback({ target: { result: null } });
						}),
					});
				}
				expect(await storage.contains('nonexistent')).toBe(false);
			});

			test('complex object storage', async () => {
				if (storageType === StorageType.INDEXED_DB) {
					mockIndexedDBOperation('put');
					mockIndexedDBOperation('get');
				}
				const complexObject = { a: 1, b: { c: 2 }, d: [3, 4, 5] };
				await storage.setItem('complex', complexObject);
				const result = await storage.getItem('complex');
				expect(result).toEqual(complexObject);
			});
		});
	};

	testStorageOperations(StorageType.LOCAL_STORAGE);
	testStorageOperations(StorageType.SESSION_STORAGE);
	testStorageOperations(StorageType.MAP);
	testStorageOperations(StorageType.INDEXED_DB);

	test('error handling', async () => {
		const storage = new Storage(StorageType.LOCAL_STORAGE);
		await expect(storage.getItem('nonexistent')).resolves.toBeNull();
		await expect(storage.removeItem('nonexistent')).resolves.not.toThrow();
	});

	test('unsupported storage type', () => {
		expect(() => new Storage('unsupported' as any)).toThrow('Unsupported storage type');
	});
});
