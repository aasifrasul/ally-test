export const mockIDBRequest = {
	result: null,
	error: null,
	addEventListener: jest.fn(),
	removeEventListener: jest.fn(),
};

export const mockIDBObjectStore = {
	put: jest.fn(),
	get: jest.fn(),
	delete: jest.fn(),
	clear: jest.fn(),
	getAllKeys: jest.fn(),
	createIndex: jest.fn(),
	transaction: {
		addEventListener: jest.fn(),
	},
};

export const mockIDBTransaction = {
	objectStore: jest.fn(() => mockIDBObjectStore),
	addEventListener: jest.fn(),
};

export const mockIDBDatabase = {
	close: jest.fn(),
	transaction: jest.fn(() => mockIDBTransaction),
	createObjectStore: jest.fn(() => mockIDBObjectStore),
};

export const indexedDB = {
	open: jest.fn(),
};

export const mockIndexedDBOpen = () => {
	const openRequest = { ...mockIDBRequest, result: mockIDBDatabase };
	indexedDB.open.mockReturnValue(openRequest);
	openRequest.addEventListener.mockImplementation((event, callback) => {
		if (event === 'success') {
			callback({ target: openRequest });
		}
	});
	return openRequest;
};

// Helper function to setup successful transaction mocks
export const setupSuccessfulTransaction = () => {
	mockIDBDatabase.transaction.mockReturnValue(mockIDBTransaction);
	mockIDBTransaction.objectStore.mockReturnValue(mockIDBObjectStore);
};

// Helper function to mock IndexedDB operations (put, get, delete, clear, getAllKeys)
export const mockIndexedDBOperation = (
	operation: 'put' | 'get' | 'delete' | 'clear' | 'getAllKeys',
	error?: Error,
) => {
	setupSuccessfulTransaction();

	const mockRequest = {
		...mockIDBRequest,
		addEventListener: jest.fn((event, callback) => {
			if (error && event === 'error') {
				callback({ target: { error } });
				return;
			}

			if (event === 'success') {
				let result = null;
				switch (operation) {
					case 'get':
						result = 'value';
						break;
					case 'getAllKeys':
						result = ['key1', 'key2'];
						break;
					case 'put':
					case 'delete':
					case 'clear':
						result = undefined;
						break;
				}
				callback({ target: { result } });
			}
		}),
	};

	mockIDBObjectStore[operation].mockReturnValue(mockRequest);
	return mockIDBObjectStore[operation];
};
