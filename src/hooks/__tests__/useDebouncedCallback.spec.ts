import { renderHook } from '@testing-library/react';
import { useDebouncedCallback } from '../useDebouncedCallback/useDebouncedCallback';

jest.useFakeTimers();

describe('useDebouncedCallback', () => {
	let mockCallback: jest.Mock<void, any[]>;
	let waitTime: number;

	beforeEach(() => {
		mockCallback = jest.fn();
		waitTime = 500;
		jest.clearAllTimers();
	});

	it('should not call the callback immediately', () => {
		renderHook(() => useDebouncedCallback(mockCallback, waitTime));
		expect(mockCallback).not.toHaveBeenCalled();
	});

	it('should call the callback after the wait time with latest arguments', () => {
		const { result } = renderHook(() => useDebouncedCallback(mockCallback, waitTime));

		result.current('test1');
		result.current('test2');

		jest.advanceTimersByTime(waitTime);

		expect(mockCallback).toHaveBeenCalledTimes(1);
		expect(mockCallback).toHaveBeenCalledWith('test2');
	});

	it('should call the callback with the latest reference', () => {
		const firstCallback = jest.fn();
		const secondCallback = jest.fn();

		const { result, rerender } = renderHook(
			({ callback }) => useDebouncedCallback(callback, waitTime),
			{
				initialProps: { callback: firstCallback },
			},
		);

		result.current('test');
		rerender({ callback: secondCallback });

		jest.advanceTimersByTime(waitTime);

		expect(firstCallback).not.toHaveBeenCalled();
		expect(secondCallback).toHaveBeenCalledTimes(1);
		expect(secondCallback).toHaveBeenCalledWith('test');
	});

	it('should cleanup timeout on unmount', () => {
		const { result, unmount } = renderHook(() =>
			useDebouncedCallback(mockCallback, waitTime),
		);

		result.current('test');
		unmount();
		jest.advanceTimersByTime(waitTime);

		expect(mockCallback).not.toHaveBeenCalled();
	});

	it('should call the callback only once if called multiple times within the wait time', () => {
		const { result } = renderHook(() => useDebouncedCallback(mockCallback, waitTime));

		result.current('test1');
		jest.advanceTimersByTime(waitTime / 2);
		result.current('test2');
		jest.advanceTimersByTime(waitTime / 2);
		result.current('test3');
		jest.advanceTimersByTime(waitTime);

		expect(mockCallback).toHaveBeenCalledTimes(1);
		expect(mockCallback).toHaveBeenCalledWith('test3');
	});

	it('should handle multiple arguments correctly', () => {
		const { result } = renderHook(() => useDebouncedCallback(mockCallback, waitTime));

		result.current('test', 123, { foo: 'bar' });
		jest.advanceTimersByTime(waitTime);

		expect(mockCallback).toHaveBeenCalledWith('test', 123, { foo: 'bar' });
	});

	it('should respect changes to wait time', () => {
		const { result, rerender } = renderHook(
			({ wait }) => useDebouncedCallback(mockCallback, wait),
			{
				initialProps: { wait: waitTime },
			},
		);

		result.current('test1');
		jest.advanceTimersByTime(waitTime - 1);
		expect(mockCallback).not.toHaveBeenCalled();

		const newWaitTime = waitTime * 2;
		rerender({ wait: newWaitTime });

		result.current('test2');
		jest.advanceTimersByTime(waitTime);
		expect(mockCallback).not.toHaveBeenCalled();

		jest.advanceTimersByTime(waitTime + 1);
		expect(mockCallback).toHaveBeenCalledTimes(1);
		expect(mockCallback).toHaveBeenCalledWith('test2');
	});

	it('should maintain correct behavior with zero wait time', () => {
		const { result } = renderHook(() => useDebouncedCallback(mockCallback, 0));

		result.current('test');
		jest.advanceTimersByTime(0);

		expect(mockCallback).toHaveBeenCalledTimes(1);
		expect(mockCallback).toHaveBeenCalledWith('test');
	});

	it('should handle rapidly changing callbacks correctly', () => {
		const callbacks = Array.from({ length: 5 }, () => jest.fn());
		const { result, rerender } = renderHook(
			({ callback }) => useDebouncedCallback(callback, waitTime),
			{
				initialProps: { callback: callbacks[0] },
			},
		);

		result.current('test');

		// Rapidly change callbacks
		callbacks.forEach((callback) => {
			rerender({ callback });
			jest.advanceTimersByTime(waitTime / callbacks.length);
		});

		jest.advanceTimersByTime(waitTime);

		// Only the last callback should be called
		callbacks.slice(0, -1).forEach((callback) => {
			expect(callback).not.toHaveBeenCalled();
		});
		expect(callbacks[callbacks.length - 1]).toHaveBeenCalledWith('test');
	});
});
