import { renderHook, act } from '@testing-library/react-hooks';
import useFetch from '../useFetch';
import { useFetchStore, useFetchDispatch } from '../../Context/dataFetchContext';

// Mock the dependencies
jest.mock('../../Context/dataFetchContext', () => ({
	useFetchStore: jest.fn(),
	useFetchDispatch: jest.fn(),
}));

class Worker {
	constructor(stringUrl) {
		this.url = stringUrl;
		this.onmessage = () => {};
	}

	postMessage(msg) {
		this.onmessage(msg);
	}
}

global.Worker = Worker;

// Mock the worker
const mockWorker = {
	postMessage: jest.fn(),
	onmessage: jest.fn(),
};
global.Worker = jest.fn().mockImplementation(() => mockWorker);

jest.mock('../../workers/MyWorker', () => ({
	default: mockWorker,
}));

describe('useFetch', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should fetch data and update the state correctly', async () => {
		const schema = 'exampleSchema';
		const initialUrl = 'https://example.com/api';
		const initialParams = { param1: 'value1', param2: 'value2' };
		const responseData = { data: 'example data' };
		const dispatchMock = jest.fn();
		const storeMock = { [schema]: { isLoading: false } };

		useFetchStore.mockReturnValue(storeMock);
		useFetchDispatch.mockReturnValue(dispatchMock);
		mockWorker.onmessage.mockImplementation((event) => {
			const { type, data } = event.data;
			if (type === 'apiResponse') {
				dispatchMock({ schema, type: 'FETCH_SUCCESS', payload: data });
			}
		});

		const { result, waitForNextUpdate } = renderHook(() =>
			useFetch(schema, initialUrl, initialParams),
		);

		expect(result.current.state).toEqual(storeMock[schema]);
		expect(result.current.errorMessage).toBe('');

		// Simulate useEffect
		expect(mockWorker.postMessage).toHaveBeenCalledWith(
			JSON.stringify({
				endpoint: `${initialUrl}?param1=value1&param2=value2`,
				options: {
					method: 'GET',
					mode: 'cors',
					cache: 'no-cache',
					credentials: 'same-origin',
					redirect: 'follow',
					referrerPolicy: 'no-referrer',
				},
			}),
		);

		// Simulate receiving the response
		act(() => {
			mockWorker.onmessage({ data: { type: 'apiResponse', data: responseData } });
		});

		// Wait for the next update to complete
		await waitForNextUpdate();

		expect(dispatchMock).toHaveBeenCalledWith({
			schema,
			type: 'FETCH_SUCCESS',
			payload: responseData,
		});
		expect(result.current.state).toEqual({ isLoading: false });
	});

	it('should initialize with the correct state', () => {
		// Mock the useFetchStore and useFetchDispatch hooks
		useFetchStore.mockReturnValue({});
		useFetchDispatch.mockReturnValue(jest.fn());

		// Render the hook
		const { result } = renderHook(() =>
			useFetch('schema', 'https://example.com', { param: 'value' }),
		);

		// Assert the initial state
		expect(result.current.state).toEqual({});
		//expect(result.current.errorMessage).toBe('');
	});

	it('should make a fetch request and update the data', async () => {
		// Mock the useFetchStore and useFetchDispatch hooks
		const dispatchMock = jest.fn();
		useFetchStore.mockReturnValue({});
		useFetchDispatch.mockReturnValue(dispatchMock);

		// Mock the worker API
		const workerMock = {
			postMessage: jest.fn(),
			onmessage: jest.fn(),
		};
		global.Worker = jest.fn().mockImplementation(() => workerMock);

		// Render the hook
		const { result, waitForNextUpdate } = renderHook(() =>
			useFetch('schema', 'https://example.com', { param: 'value' }),
		);

		// Assert the loading state and dispatch calls
		console.log(result.current.state);
		expect(result.current.state).toEqual({ fetching: true });
		expect(dispatchMock).toHaveBeenCalledWith({
			schema: 'schema',
			type: 'FETCH_INIT',
		});

		// Simulate the worker response
		const responseData = { data: 'response data' };
		workerMock.onmessage({ data: { type: 'apiResponse', data: responseData } });

		// Wait for the update
		await waitForNextUpdate();

		// Assert the data and dispatch calls
		expect(result.current.state).toEqual({ fetching: false, data: responseData });
		expect(dispatchMock).toHaveBeenCalledWith({
			schema: 'schema',
			type: 'FETCH_SUCCESS',
			payload: responseData,
		});
	});

	// Add more test cases for different scenarios
});
