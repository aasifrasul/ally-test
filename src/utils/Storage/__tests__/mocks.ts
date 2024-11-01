export const indexedDB = {
	open: jest.fn(),
};

export const mockIDBRequest = {
	result: {},
	error: null,
	addEventListener: jest.fn(),
};

export const mockIDBObjectStore = {
	add: jest.fn(),
	get: jest.fn(),
	put: jest.fn(),
	delete: jest.fn(),
};

export const mockIDBTransaction = {
	objectStore: jest.fn(() => mockIDBObjectStore),
	//addEventListener: jest.fn(),
};

export const mockIDBDatabase = {
	transaction: jest.fn(() => mockIDBTransaction),
	close: jest.fn(),
	createObjectStore: jest.fn(),
};

export function mockIndexedDBOpen() {
	indexedDB.open.mockReturnValue(mockIDBRequest);
	mockIDBRequest.addEventListener.mockImplementation((event, callback) => {
		if (event === 'success') {
			callback({ target: { result: mockIDBDatabase } });
		}
	});
}

export const mockIndexedDBOperation = (operationType: 'get' | 'put' | 'delete') => {
	mockIDBObjectStore[operationType].mockReturnValue(mockIDBRequest);
	mockIDBRequest.addEventListener.mockImplementation((event, callback) => {
		if (event === 'success') {
			callback({
				target: { result: operationType === 'get' ? { value: 'value' } : undefined },
			});
		}
	});
};
