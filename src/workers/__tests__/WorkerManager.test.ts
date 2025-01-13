import { WorkerManager } from '../WorkerManager';
import { WorkerMessageQueue } from '../WorkerMessageQueue';

// Mock the WorkerMessageQueue class
jest.mock('../WorkerMessageQueue', () => {
	return {
		WorkerMessageQueue: jest.fn().mockImplementation(() => {
			return {};
		}),
	};
});

describe('Worker Utility Functions', () => {
	let mockWorker: {
		terminate: jest.Mock;
	};
	const workerScript = '../MyWorker.worker.ts';
	let workerManager: WorkerManager;

	beforeEach(() => {
		// Clear all mocks before each test
		jest.clearAllMocks();

		// Reset the module to clear any existing worker or message queue
		jest.resetModules();

		// Create a mock Worker
		mockWorker = {
			terminate: jest.fn(),
		};

		// Mock the global Worker constructor
		global.Worker = jest.fn(() => mockWorker) as any;
		workerManager = WorkerManager.getInstance();
	});

	test('initializeMessageQueue should create a new worker and message queue', () => {
		const messageQueue = workerManager.initializeMessageQueue();

		expect(global.Worker).toHaveBeenCalledTimes(1);
		expect(global.Worker).toHaveBeenCalledWith(workerScript);
		expect(WorkerMessageQueue).toHaveBeenCalledTimes(1);
		expect(WorkerMessageQueue).toHaveBeenCalledWith(mockWorker);
		expect(messageQueue).toBeInstanceOf(Object);
	});

	test('initializeMessageQueue should return the same message queue on subsequent calls', () => {
		const messageQueue1 = workerManager.initializeMessageQueue();
		const messageQueue2 = workerManager.initializeMessageQueue();

		expect(global.Worker).toHaveBeenCalledTimes(1);
		expect(WorkerMessageQueue).toHaveBeenCalledTimes(1);
		expect(messageQueue1).toBe(messageQueue2);
	});

	test('initializeMessageQueue should throw an error if message queue creation fails', () => {
		// Mock WorkerMessageQueue to return null
		(WorkerMessageQueue as unknown as jest.Mock).mockImplementationOnce(() => null);

		expect(() => {
			workerManager.initializeMessageQueue();
		}).toThrow('Failed to initialize worker message queue');
	});

	test('closeMessageQueue should terminate the worker and reset variables', () => {
		workerManager.initializeMessageQueue();
		workerManager.closeMessageQueue();

		expect(mockWorker.terminate).toHaveBeenCalledTimes(1);

		// Call initializeMessageQueue again to check if a new worker is created
		workerManager.initializeMessageQueue();
		expect(global.Worker).toHaveBeenCalledTimes(2);
	});

	test('closeMessageQueue should do nothing if no worker exists', () => {
		workerManager.closeMessageQueue();

		expect(mockWorker.terminate).not.toHaveBeenCalled();
	});
});
