import { IndexedDBStorage } from '../IndexedDBStorage';

import {
	mockIDBDatabase,
	indexedDB,
	mockIDBRequest,
	mockIDBObjectStore,
	mockIndexedDBOpen,
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

	test('setItem should add data successfully', async () => {
		mockIndexedDBOpen();
		mockIDBObjectStore.put.mockReturnValue(mockIDBRequest);
		mockIDBRequest.addEventListener.mockImplementation((event, callback) => {
			if (event === 'success') {
				callback({});
			}
		});

		await expect(storage.setItem('1', { name: 'John Doe' })).resolves.toBeUndefined();
	});

	test('getItem should retrieve data successfully', async () => {
		mockIndexedDBOpen();
		mockIDBObjectStore.get.mockReturnValue(mockIDBRequest);
		mockIDBRequest.addEventListener.mockImplementation((event, callback) => {
			if (event === 'success') {
				callback({ target: { result: { id: '1', value: { name: 'John Doe' } } } });
			}
		});

		await expect(storage.getItem('1')).resolves.toEqual({ name: 'John Doe' });
	});

	test('removeItem should delete data successfully', async () => {
		mockIndexedDBOpen();
		mockIDBObjectStore.delete.mockReturnValue(mockIDBRequest);
		mockIDBRequest.addEventListener.mockImplementation((event, callback) => {
			if (event === 'success') {
				callback({});
			}
		});

		await expect(storage.removeItem('1')).resolves.toBeUndefined();
	});

	test('contains should check if data exists', async () => {
		mockIndexedDBOpen();
		mockIDBObjectStore.get.mockReturnValue(mockIDBRequest);
		mockIDBRequest.addEventListener.mockImplementation((event, callback) => {
			if (event === 'success') {
				callback({ target: { result: { id: '1', value: { name: 'John Doe' } } } });
			}
		});

		await expect(storage.contains('1')).resolves.toBe(true);
	});

	test('close should close the database', () => {
		(storage as any).db = mockIDBDatabase;
		storage.close();
		expect(mockIDBDatabase.close).toHaveBeenCalled();
	});
});
