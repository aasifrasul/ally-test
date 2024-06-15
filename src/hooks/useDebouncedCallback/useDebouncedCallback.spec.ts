import { renderHook } from '@testing-library/react-hooks';

import { useDebouncedCallback } from './useDebouncedcallback';

jest.useFakeTimers();

describe('useDebouncedCallback', () => {
	let mockCallback: jest.Mock<void, any[]>;
	let waitTime: number;

	beforeEach(() => {
		mockCallback = jest.fn();
		waitTime = 500;
	});

	it('should not call the callback immediately', () => {
		renderHook(() => useDebouncedCallback(mockCallback, waitTime));
		expect(mockCallback).not.toHaveBeenCalled();
	});

	it('should call the callback after the wait time with latest arguments', () => {
		const { result } = renderHook(() => useDebouncedCallback(mockCallback, waitTime));
		const debouncedCallback = result.current;

		debouncedCallback('test1');
		debouncedCallback('test2');

		jest.advanceTimersByTime(waitTime + 1); // Ensure enough time has passed

		expect(mockCallback).toHaveBeenCalledTimes(1);
		expect(mockCallback).toHaveBeenCalledWith('test2');
	});

	it('should cleanup timeout on unmount', () => {
		const cleanup = jest.fn();
		renderHook(() => {
			useDebouncedCallback(mockCallback, waitTime);
			cleanup();
		});

		expect(cleanup).toHaveBeenCalled();
	});
});
