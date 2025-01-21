import { Storage, StorageError, StorageInitializationError } from '..';
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
			beforeEach(async () => {
				storage = new Storage(
					storageType,
					storageType === StorageType.INDEXED_DB ? 'testDB' : undefined,
					storageType === StorageType.INDEXED_DB ? 'testStore' : undefined,
				);
				if (storageType === StorageType.INDEXED_DB) {
					mockIndexedDBOpen();
				}
				await storage.initialize();
			});

			afterEach(() => {
				if (storage) {
					storage.close();
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

			test('empty key behavior', async () => {
				if (storageType === StorageType.INDEXED_DB) {
					mockIndexedDBOperation('put');
					mockIndexedDBOperation('get');
				}
				await storage.setItem('', 'value');
				const result = await storage.getItem('');
				expect(result).toBe('value');
			});

			test('large data storage', async () => {
				if (storageType === StorageType.INDEXED_DB) {
					mockIndexedDBOperation('put');
					mockIndexedDBOperation('get');
				}
				const largeData = Array.from({ length: 10000 }, (_, i) => i.toString());
				await storage.setItem('largeData', largeData);
				const result = await storage.getItem('largeData');
				expect(result).toEqual(largeData);
			});

			test('error handling', async () => {
				if (storageType === StorageType.INDEXED_DB) {
					mockIndexedDBOperation('put', new Error('Database error'));
				} else {
					const mockSetItem = jest.spyOn(
						storageType === StorageType.LOCAL_STORAGE
							? localStorage
							: sessionStorage,
						'setItem',
					);
					mockSetItem.mockImplementation(() => {
						throw new Error('Storage error');
					});
				}
				await expect(storage.setItem('key', 'value')).rejects.toThrow(StorageError);
			});

			test('clear storage', async () => {
				if (storageType === StorageType.INDEXED_DB) {
					mockIndexedDBOperation('put');
					mockIndexedDBOperation('clear');
				}
				await storage.setItem('key1', 'value1');
				await storage.setItem('key2', 'value2');
				await storage.clear();
				expect(await storage.getItem('key1')).toBeNull();
				expect(await storage.getItem('key2')).toBeNull();
			});

			test('getAllKeys', async () => {
				if (storageType === StorageType.INDEXED_DB) {
					mockIndexedDBOperation('put');
					mockIndexedDBOperation('getAllKeys');
				}
				await storage.setItem('key1', 'value1');
				await storage.setItem('key2', 'value2');
				const keys = await storage.getAllKeys();
				expect(keys).toContain('key1');
				expect(keys).toContain('key2');
			});
		});
	};

	testStorageOperations(StorageType.LOCAL_STORAGE);
	testStorageOperations(StorageType.SESSION_STORAGE);
	testStorageOperations(StorageType.INDEXED_DB);

	test('initialization error for IndexedDB without required params', () => {
		expect(() => new Storage(StorageType.INDEXED_DB)).toThrow(StorageInitializationError);
	});

	test('unsupported storage type', () => {
		expect(() => new Storage('unsupported' as StorageType)).toThrow(
			StorageInitializationError,
		);
	});
});
