import { WorkerQueue } from '../WorkerQueue';
import { MockWorker } from './MockWorker';
import { WorkerMessage, HTTPMethod } from '../../types/api';

// Mock URL
(global as any).URL = class {
	constructor() {
		return {};
	}
};

jest.mock('../../utils/logger', () => ({
	createLogger: () => ({
		error: jest.fn(),
		info: jest.fn(),
		warn: jest.fn(),
	}),
}));

describe('WorkerQueue', () => {
	let workerQueue: WorkerQueue;
	let mockWorker: MockWorker;

	beforeEach(() => {
		// Reset the singleton instance
		(WorkerQueue as any).instance = null;

		// Setup mock worker
		mockWorker = new MockWorker();
		(global as any).Worker = jest.fn(() => mockWorker);

		workerQueue = WorkerQueue.getInstance();
	});

	afterEach(() => {
		workerQueue.terminate();
	});

	describe('Singleton Pattern', () => {
		it('should create only one instance', () => {
			const instance1 = WorkerQueue.getInstance();
			const instance2 = WorkerQueue.getInstance();
			expect(instance1).toBe(instance2);
		});
	});

	describe('Message Handling', () => {
		it('should handle successful messages', async () => {
			const responseData = { success: true };
			let requestId: string;

			mockWorker.postMessage = jest.fn((message) => {
				requestId = message.id;
				setTimeout(() => {
					const response: WorkerMessage = {
						id: requestId,
						type: 'response',
						data: responseData,
					};
					mockWorker.onmessage!(new MessageEvent('message', { data: response }));
				}, 10);
			});

			const result = await workerQueue.fetchAPIData('/test');
			expect(result).toEqual(responseData);
		});

		it('should handle error messages', async () => {
			const errorMessage = 'Test error';
			let requestId: string;

			mockWorker.postMessage = jest.fn((message) => {
				requestId = message.id;
				setTimeout(() => {
					const response: WorkerMessage = {
						id: requestId,
						type: 'response',
						data: null,
						error: errorMessage,
					};
					mockWorker.onmessage!(new MessageEvent('message', { data: response }));
				}, 10);
			});

			await expect(workerQueue.fetchAPIData('/test')).rejects.toThrow(errorMessage);
		});

		it('should handle worker errors', () => {
			const error = new ErrorEvent('error', { error: new Error('Worker error') });
			mockWorker.onerror!(error);
			// Verify that error was logged (if using logger)
		});
	});

	describe('Timeout Handling', () => {
		it('should timeout after specified duration', async () => {
			mockWorker.postMessage = jest.fn();

			const promise = workerQueue.fetchAPIData('/test', undefined);
			await expect(promise).rejects.toThrow('Request timeout after 100ms');
		});

		it('should clear timeout on successful response', async () => {
			let requestId: string;

			mockWorker.postMessage = jest.fn((message) => {
				requestId = message.id;
				setTimeout(() => {
					const response: WorkerMessage = {
						id: requestId,
						type: 'response',
						data: { success: true },
					};
					mockWorker.onmessage!(new MessageEvent('message', { data: response }));
				}, 50);
			});

			const result = await workerQueue.fetchAPIData('/test', undefined);
			expect(result).toEqual({ success: true });
		});
	});

	describe('Public API Methods', () => {
		it('should handle fetchAPIData', async () => {
			const endpoint = '/api/test';
			const options = { method: HTTPMethod.POST };
			let sentMessage: any;

			mockWorker.postMessage = jest.fn((message) => {
				sentMessage = message;
				const response: WorkerMessage = {
					id: message.id,
					type: 'response',
					data: { success: true },
				};
				setTimeout(() => {
					mockWorker.onmessage!(new MessageEvent('message', { data: response }));
				}, 10);
			});

			await workerQueue.fetchAPIData(endpoint, options);
			expect(sentMessage.type).toBe('fetchAPIData');
			expect(sentMessage.data).toEqual({ endpoint, options });
		});

		it('should handle loadImages', async () => {
			const imageUrls = ['image1.jpg', 'image2.jpg'];
			let sentMessage: any;

			mockWorker.postMessage = jest.fn((message) => {
				sentMessage = message;
				const response: WorkerMessage = {
					id: message.id,
					type: 'response',
					data: ['data:image1', 'data:image2'],
				};
				setTimeout(() => {
					mockWorker.onmessage!(new MessageEvent('message', { data: response }));
				}, 10);
			});

			const result = await workerQueue.loadImages(imageUrls);
			expect(sentMessage.type).toBe('loadImages');
			expect(sentMessage.data).toEqual(imageUrls);
			expect(result).toEqual(['data:image1', 'data:image2']);
		});

		it('should handle loadImage', async () => {
			const imageUrl = 'image.jpg';
			let sentMessage: any;

			mockWorker.postMessage = jest.fn((message) => {
				sentMessage = message;
				const response: WorkerMessage = {
					id: message.id,
					type: 'response',
					data: 'data:image',
				};
				setTimeout(() => {
					mockWorker.onmessage!(new MessageEvent('message', { data: response }));
				}, 10);
			});

			const result = await workerQueue.loadImage(imageUrl);
			expect(sentMessage.type).toBe('loadImage');
			expect(sentMessage.data).toBe(imageUrl);
			expect(result).toBe('data:image');
		});

		it('should handle abortFetchRequest', async () => {
			const endpoint = '/api/test';
			let sentMessage: any;

			mockWorker.postMessage = jest.fn((message) => {
				sentMessage = message;
				const response: WorkerMessage = {
					id: message.id,
					type: 'response',
					data: undefined,
				};
				setTimeout(() => {
					mockWorker.onmessage!(new MessageEvent('message', { data: response }));
				}, 10);
			});

			await workerQueue.abortFetchRequest(endpoint);
			expect(sentMessage.type).toBe('abortFetchRequest');
			expect(sentMessage.data).toBe(endpoint);
		});
	});

	describe('Termination', () => {
		it('should clean up resources on terminate', () => {
			const terminateSpy = jest.spyOn(mockWorker, 'terminate');
			workerQueue.terminate();

			expect(terminateSpy).toHaveBeenCalled();
			expect(WorkerQueue.getInstance()).not.toBe(workerQueue);
		});
	});
});
