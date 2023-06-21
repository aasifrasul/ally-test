import useWebWorker from './useWebWorker';

describe('useWebWorker', () => {
	let mockWorker;
	let mockPostMessage;
	let mockOnMessage;

	beforeEach(() => {
		mockPostMessage = jest.fn();
		mockOnMessage = jest.fn();
		mockWorker = {
			postMessage: mockPostMessage,
			onmessage: mockOnMessage,
		};

		// Replace the global Worker constructor with a mock implementation
		global.Worker = jest.fn().mockImplementation(() => mockWorker);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('should fetch API data and resolve the promise on successful response', async () => {
		const endpoint = '/api/data';
		const options = { method: 'GET' };
		const responseData = { result: 'Success' };

		// Create a promise for the onmessage callback
		const onMessagePromise = new Promise((resolve) => {
			mockOnMessage.mockImplementationOnce((event) => {
				const { type, data } = JSON.parse(event.data);
				if (type === 'apiResponse') {
					resolve({ data });
				}
			});
		});

		const { fetchAPIData } = useWebWorker();
		const fetchDataPromise = fetchAPIData(endpoint, options);

		expect(global.Worker).toHaveBeenCalledWith('../workers/MyWorker');

		expect(mockPostMessage).toHaveBeenCalledWith(JSON.stringify({ endpoint, options }));

		// Simulate the response from the worker
		mockOnMessage({ data: JSON.stringify({ type: 'apiResponse', data: responseData }) });

		// Wait for the promise to resolve
		const response = await Promise.all([fetchDataPromise, onMessagePromise]);

		expect(response[0]).toEqual(responseData);
	});

	it('should fetch API data and reject the promise on error response', async () => {
		const endpoint = '/api/data';
		const options = { method: 'GET' };

		// Create a promise for the onmessage callback
		const onMessagePromise = new Promise((resolve) => {
			mockOnMessage.mockImplementationOnce((event) => {
				const { type } = JSON.parse(event.data);
				if (type !== 'apiResponse') {
					resolve();
				}
			});
		});

		const { fetchAPIData } = useWebWorker();
		const fetchDataPromise = fetchAPIData(endpoint, options);

		expect(global.Worker).toHaveBeenCalledWith('../workers/MyWorker');

		expect(mockPostMessage).toHaveBeenCalledWith(JSON.stringify({ endpoint, options }));

		// Simulate an error response from the worker
		mockOnMessage({ data: JSON.stringify({ type: 'error' }) });

		// Wait for the promise to reject
		await expect(fetchDataPromise).rejects.toThrow('There was some error.');

		// Wait for the onmessage callback to be called
		await onMessagePromise;
	});
});
