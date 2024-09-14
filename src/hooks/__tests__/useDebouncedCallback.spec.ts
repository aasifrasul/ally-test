import { renderHook, act } from '@testing-library/react-hooks';
import { useDebouncedCallback } from '../useDebouncedCallback/useDebouncedCallback';

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
		const { unmount } = renderHook(() => {
			useDebouncedCallback(mockCallback, waitTime);
			cleanup();
		});

		unmount();

		expect(cleanup).toHaveBeenCalled();
	});

	it('should call the callback only once if called multiple times within the wait time', () => {
		const { result } = renderHook(() => useDebouncedCallback(mockCallback, waitTime));
		const debouncedCallback = result.current;

		debouncedCallback('test1');
		jest.advanceTimersByTime(waitTime / 2);
		debouncedCallback('test2');
		jest.advanceTimersByTime(waitTime / 2);
		debouncedCallback('test3');
		jest.advanceTimersByTime(waitTime + 1); // Ensure enough time has passed

		expect(mockCallback).toHaveBeenCalledTimes(1);
		expect(mockCallback).toHaveBeenCalledWith('test3');
	});

	it('should not call the callback if unmounted before the wait time', () => {
		const { result, unmount } = renderHook(() =>
			useDebouncedCallback(mockCallback, waitTime),
		);
		const debouncedCallback = result.current;

		debouncedCallback('test1');
		unmount();
		jest.advanceTimersByTime(waitTime + 1); // Ensure enough time has passed

		expect(mockCallback).not.toHaveBeenCalled();
	});

	it('should call the callback with the correct context', () => {
		const context = { value: 'context' };
		const { result } = renderHook(() =>
			useDebouncedCallback(mockCallback.bind(context), waitTime),
		);
		const debouncedCallback = result.current;

		debouncedCallback('test');
		jest.advanceTimersByTime(waitTime + 1); // Ensure enough time has passed

		expect(mockCallback).toHaveBeenCalledTimes(1);
		expect(mockCallback).toHaveBeenCalledWith('test');
		expect(mockCallback.mock.instances[0]).toBe(context);
	});

	it('should respect changes to wait time for new invocations', () => {
		const { result, rerender } = renderHook(
			({ wait }) => useDebouncedCallback(mockCallback, wait),
			{ initialProps: { wait: waitTime } },
		);

		// Initial call with original wait time
		result.current('test1');
		jest.advanceTimersByTime(waitTime - 1);
		expect(mockCallback).not.toHaveBeenCalled();

		jest.advanceTimersByTime(1);
		expect(mockCallback).toHaveBeenCalledTimes(1);
		expect(mockCallback).toHaveBeenCalledWith('test1');

		mockCallback.mockClear();

		// Change wait time
		rerender({ wait: waitTime * 2 });

		// New call with new wait time
		result.current('test2');
		jest.advanceTimersByTime(waitTime);
		expect(mockCallback).not.toHaveBeenCalled();

		jest.advanceTimersByTime(waitTime + 1);
		expect(mockCallback).toHaveBeenCalledTimes(1);
		expect(mockCallback).toHaveBeenCalledWith('test2');
	});
});
