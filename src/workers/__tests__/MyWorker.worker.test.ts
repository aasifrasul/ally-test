import { APIService } from '../../services/APIService';
import { ImageService } from '../../services/ImageService';
import { createLogger } from '../../utils/Logger';
import { WorkerMessage } from '../../types/api';

// Mock the services and logger
jest.mock('../../services/APIService');
jest.mock('../../services/ImageService');
jest.mock('../../utils/logger');

describe('Worker', () => {
	let worker: Worker;
	let postMessageMock: jest.Mock;
	let apiServiceMock: jest.Mocked<APIService>;
	let imageServiceMock: jest.Mocked<ImageService>;
	let loggerMock: { error: jest.Mock };
	let messageHandler: (event: MessageEvent) => void;

	beforeEach(() => {
		// Set up mocks
		postMessageMock = jest.fn();
		(global as any).self = {
			addEventListener: jest.fn((type, handler) => {
				if (type === 'message') {
					messageHandler = handler;
				}
			}),
			postMessage: postMessageMock,
		};

		apiServiceMock = APIService.getInstance() as jest.Mocked<APIService>;
		imageServiceMock = ImageService.getInstance() as jest.Mocked<ImageService>;
		loggerMock = { error: jest.fn() };

		(createLogger as jest.Mock).mockReturnValue(loggerMock);

		// Import the worker code
		jest.isolateModules(() => {
			require('../MyWorker.worker');
		});

		// Get the worker instance
		worker = (global as any).self;
	});

	afterEach(() => {
		jest.resetModules();
		jest.clearAllMocks();
	});

	it('should handle fetchAPIData message', async () => {
		const message: WorkerMessage = {
			id: '1',
			type: 'fetchAPIData',
			data: { endpoint: '/api/data', options: {} },
		};

		const mockResponse = { data: 'test' };
		apiServiceMock.fetch.mockResolvedValue(mockResponse);

		await messageHandler(new MessageEvent('message', { data: message }));

		expect(apiServiceMock.fetch).toHaveBeenCalledWith('/api/data', {});
		expect(postMessageMock).toHaveBeenCalledWith({
			id: 1,
			type: 'fetchAPIDataResponse',
			data: mockResponse,
		});
	});

	it('should handle loadImages message', async () => {
		const message: WorkerMessage = {
			id: '2',
			type: 'loadImages',
			data: ['image1.jpg', 'image2.jpg'],
		};

		const mockImages = ['data:image1', 'data:image2'];
		imageServiceMock.loadMultiple.mockResolvedValue(mockImages);

		await messageHandler(new MessageEvent('message', { data: message }));

		expect(imageServiceMock.loadMultiple).toHaveBeenCalledWith([
			'image1.jpg',
			'image2.jpg',
		]);
		expect(postMessageMock).toHaveBeenCalledWith({
			id: 2,
			type: 'loadImagesResponse',
			data: mockImages,
		});
	});

	it('should handle loadImage message', async () => {
		const message: WorkerMessage = {
			id: '3',
			type: 'loadImage',
			data: 'image.jpg',
		};

		const mockImage = 'data:image';
		imageServiceMock.load.mockResolvedValue(mockImage);

		await messageHandler(new MessageEvent('message', { data: message }));

		expect(imageServiceMock.load).toHaveBeenCalledWith('image.jpg');
		expect(postMessageMock).toHaveBeenCalledWith({
			id: 3,
			type: 'loadImageResponse',
			data: mockImage,
		});
	});

	it('should handle abortFetchRequest message', async () => {
		const message: WorkerMessage = {
			id: '4',
			type: 'abortFetchRequest',
			data: 'requestId',
		};

		await messageHandler(new MessageEvent('message', { data: message }));

		expect(apiServiceMock.abort).toHaveBeenCalledWith('requestId');
		expect(postMessageMock).toHaveBeenCalledWith({
			id: 4,
			type: 'abortFetchRequestResponse',
			data: 'Request aborted',
		});
	});

	it('should handle unknown message type', async () => {
		const message: WorkerMessage = {
			id: '5',
			type: 'unknownType' as any,
			data: {},
		};

		await messageHandler(new MessageEvent('message', { data: message }));

		expect(loggerMock.error).toHaveBeenCalledWith(
			'Error processing unknownType:',
			expect.any(Error),
		);
		expect(postMessageMock).toHaveBeenCalledWith({
			id: 5,
			type: 'unknownTypeError',
			error: 'Unknown message type: unknownType',
		});
	});

	it('should handle invalid message format', async () => {
		const invalidMessage = { invalid: 'message' };

		await messageHandler(new MessageEvent('message', { data: invalidMessage }));

		expect(postMessageMock).toHaveBeenCalledWith({
			id: 0,
			type: 'error',
			error: 'Invalid message format',
		});
	});
});
