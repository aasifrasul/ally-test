import { renderHook, act } from '@testing-library/react-hooks';
import useFetch from './useFetch';
import { useFetchStore, useFetchDispatch } from '../Context/dataFetchContext';

// Mock the dependencies
jest.mock('../Context/dataFetchContext', () => ({
	useFetchStore: jest.fn(),
	useFetchDispatch: jest.fn(),
}));

// Mock the worker
const mockWorker = {
	postMessage: jest.fn(),
	onmessage: jest.fn(),
};
jest.mock('../workers/MyWorker', () => ({
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
			useFetch(schema, initialUrl, initialParams)
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
			})
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

	// Add more test cases for different scenarios
});
