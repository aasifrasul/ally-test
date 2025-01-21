import { IndexedDBStorage } from '../IndexedDBStorage';
import {
	mockIDBDatabase,
	indexedDB,
	mockIDBRequest,
	mockIDBObjectStore,
	mockIndexedDBOpen,
	setupSuccessfulTransaction,
} from './mocks';

jest.mock('../../../utils/logger', () => ({
	createLogger: jest.fn(() => ({
		info: jest.fn(),
		error: jest.fn(),
	})),
	LogLevel: {
		DEBUG: 'debug',
	},
}));

describe('IndexedDBStorage', () => {
	let storage: IndexedDBStorage;

	beforeEach(() => {
		jest.clearAllMocks();
		(global as any).indexedDB = indexedDB;
		storage = new IndexedDBStorage();
	});

	describe('initialization', () => {
		test('should initialize successfully', async () => {
			mockIndexedDBOpen();
			await expect(storage.initialize()).resolves.toBeUndefined();
			expect((storage as any).initialized).toBe(true);
		});

		test('should not initialize twice', async () => {
			mockIndexedDBOpen();
			await storage.initialize();
			await storage.initialize();
			expect(indexedDB.open).toHaveBeenCalledTimes(1);
		});

		test('should handle initialization error', async () => {
			const openRequest = mockIndexedDBOpen();
			openRequest.addEventListener.mockImplementation((event, callback) => {
				if (event === 'error') {
					callback({ target: { error: new Error('Init failed') } });
				}
			});

			await expect(storage.initialize()).rejects.toThrow('Init failed');
		});

		test('should handle upgradeneeded event', async () => {
			const openRequest = mockIndexedDBOpen();
			openRequest.addEventListener.mockImplementation((event, callback) => {
				if (event === 'upgradeneeded') {
					callback({ target: { result: mockIDBDatabase } });
				} else if (event === 'success') {
					callback({ target: openRequest });
				}
			});

			await storage.initialize();
			expect(mockIDBDatabase.createObjectStore).toHaveBeenCalled();
		});
	});

	describe('CRUD operations', () => {
		beforeEach(async () => {
			mockIndexedDBOpen();
			await storage.initialize();
			setupSuccessfulTransaction();
		});

		test('setItem should add data successfully', async () => {
			const testData = { name: 'John Doe' };
			mockIDBObjectStore.put.mockReturnValue(mockIDBRequest);
			mockIDBRequest.addEventListener.mockImplementation((event, callback) => {
				if (event === 'success') callback({});
			});

			await expect(storage.setItem('1', testData)).resolves.toBeUndefined();
			expect(mockIDBObjectStore.put).toHaveBeenCalledWith({
				id: '1',
				value: testData,
			});
		});

		test('getItem should retrieve data successfully', async () => {
			const testData = { name: 'John Doe' };
			const mockResult = { id: '1', value: testData };

			mockIDBObjectStore.get.mockReturnValue({
				...mockIDBRequest,
				result: mockResult,
				addEventListener: jest.fn().mockImplementation((event, callback) => {
					if (event === 'success') {
						callback({ target: { result: mockResult } });
					}
				}),
			});

			const result = await storage.getItem('1');
			expect(result).toEqual(testData);
			expect(mockIDBObjectStore.get).toHaveBeenCalledWith('1');
		});

		test('getItem should return null for non-existent key', async () => {
			mockIDBObjectStore.get.mockReturnValue({
				...mockIDBRequest,
				result: null,
				addEventListener: jest.fn().mockImplementation((event, callback) => {
					if (event === 'success') {
						callback({ target: { result: null } });
					}
				}),
			});

			const result = await storage.getItem('1');
			expect(result).toBeNull();
		});

		test('getAllKeys should retrieve all keys successfully', async () => {
			const mockKeys = ['1', '2', '3'];
			mockIDBObjectStore.getAllKeys.mockReturnValue({
				...mockIDBRequest,
				result: mockKeys,
				addEventListener: jest.fn().mockImplementation((event, callback) => {
					if (event === 'success') {
						callback({ target: { result: mockKeys } });
					}
				}),
			});

			const result = await storage.getAllKeys();
			expect(result).toEqual(mockKeys);
		});

		test('removeItem should delete data successfully', async () => {
			mockIDBObjectStore.delete.mockReturnValue(mockIDBRequest);
			mockIDBRequest.addEventListener.mockImplementation((event, callback) => {
				if (event === 'success') callback({});
			});

			await expect(storage.removeItem('1')).resolves.toBeUndefined();
			expect(mockIDBObjectStore.delete).toHaveBeenCalledWith('1');
		});

		test('contains should return true when data exists', async () => {
			const testData = { name: 'John Doe' };
			const mockResult = { id: '1', value: testData };

			mockIDBObjectStore.get.mockReturnValue({
				...mockIDBRequest,
				result: mockResult,
				addEventListener: jest.fn().mockImplementation((event, callback) => {
					if (event === 'success') {
						callback({ target: { result: mockResult } });
					}
				}),
			});

			const result = await storage.contains('1');
			expect(result).toBe(true);
		});

		test('contains should return false when data does not exist', async () => {
			mockIDBObjectStore.get.mockReturnValue({
				...mockIDBRequest,
				result: null,
				addEventListener: jest.fn().mockImplementation((event, callback) => {
					if (event === 'success') {
						callback({ target: { result: null } });
					}
				}),
			});

			const result = await storage.contains('1');
			expect(result).toBe(false);
		});

		test('clear should clear all data successfully', async () => {
			mockIDBObjectStore.clear.mockReturnValue(mockIDBRequest);
			mockIDBRequest.addEventListener.mockImplementation((event, callback) => {
				if (event === 'success') callback({});
			});

			await expect(storage.clear()).resolves.toBeUndefined();
			expect(mockIDBObjectStore.clear).toHaveBeenCalled();
		});
	});

	describe('error handling', () => {
		test('should throw error when not initialized', async () => {
			await expect(storage.getItem('1')).rejects.toThrow('Storage not initialized');
			await expect(storage.setItem('1', {})).rejects.toThrow('Storage not initialized');
			await expect(storage.removeItem('1')).rejects.toThrow('Storage not initialized');
			await expect(storage.clear()).rejects.toThrow('Storage not initialized');
			await expect(storage.getAllKeys()).rejects.toThrow('Storage not initialized');
		});
	});

	describe('database management', () => {
		test('close should close the database', async () => {
			mockIndexedDBOpen();
			await storage.initialize();
			storage.close();
			expect(mockIDBDatabase.close).toHaveBeenCalled();
			expect((storage as any).initialized).toBe(false);
			expect((storage as any).db).toBeNull();
		});

		test('close should do nothing if database is not open', () => {
			storage.close();
			expect(mockIDBDatabase.close).not.toHaveBeenCalled();
		});
	});
});
