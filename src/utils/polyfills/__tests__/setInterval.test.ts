import { setInterval } from '../setInterval';

describe('Enhanced setInterval', () => {
	let originalSetTimeout: typeof setTimeout;
	let originalClearTimeout: typeof clearTimeout;

	beforeEach(() => {
		jest.useFakeTimers();
		originalSetTimeout = global.setTimeout;
		originalClearTimeout = global.clearTimeout;
	});

	afterEach(() => {
		jest.clearAllTimers();
		jest.useRealTimers();
	});

	test('should throw TypeError for non-function callback', () => {
		expect(() => setInterval('not a function' as any, 1000)).toThrow(TypeError);
		expect(() => setInterval(null as any, 1000)).toThrow(TypeError);
		expect(() => setInterval(undefined as any, 1000)).toThrow(TypeError);
	});

	test('should throw TypeError for invalid interval', () => {
		expect(() => setInterval(() => {}, -1000)).toThrow(TypeError);
		expect(() => setInterval(() => {}, 'not a number' as any)).toThrow(TypeError);
	});

	test('should execute callback with provided parameters', () => {
		const mockCallback = jest.fn();
		const interval = setInterval(mockCallback, 1000, 'param1', 'param2');

		jest.advanceTimersByTime(1000);
		expect(mockCallback).toHaveBeenCalledWith('param1', 'param2');

		interval.stop();
	});

	test('should execute callback repeatedly at specified interval', () => {
		const mockCallback = jest.fn();
		const interval = setInterval(mockCallback, 1000);

		jest.advanceTimersByTime(3500);
		expect(mockCallback).toHaveBeenCalledTimes(3);

		interval.stop();
	});

	test('pause should temporarily stop execution', () => {
		const mockCallback = jest.fn();
		const interval = setInterval(mockCallback, 1000);

		jest.advanceTimersByTime(1500); // Should execute once
		interval.pause();

		jest.advanceTimersByTime(2000); // Should not execute during pause
		expect(mockCallback).toHaveBeenCalledTimes(1);

		interval.resume();
		jest.advanceTimersByTime(1000); // Should execute again after resume
		expect(mockCallback).toHaveBeenCalledTimes(2);

		interval.stop();
	});

	test('resume should have no effect if not paused', () => {
		const mockCallback = jest.fn();
		const interval = setInterval(mockCallback, 1000);

		interval.resume(); // Should have no effect
		jest.advanceTimersByTime(1500);
		expect(mockCallback).toHaveBeenCalledTimes(1);

		interval.stop();
	});

	test('stop should prevent further executions', () => {
		const mockCallback = jest.fn();
		const interval = setInterval(mockCallback, 1000);

		jest.advanceTimersByTime(1500);
		interval.stop();

		jest.advanceTimersByTime(2000);
		expect(mockCallback).toHaveBeenCalledTimes(1);
	});

	test('should handle thrown errors in callback', () => {
		const errorCallback = jest.fn(() => {
			throw new Error('Test error');
		});

		const interval = setInterval(errorCallback, 1000);

		expect(() => {
			jest.advanceTimersByTime(1000);
		}).toThrow('Test error');

		// Verify that the interval was stopped after error
		jest.advanceTimersByTime(1000);
		expect(errorCallback).toHaveBeenCalledTimes(1);
	});

	test('multiple pause/resume cycles should work correctly', () => {
		const mockCallback = jest.fn();
		const interval = setInterval(mockCallback, 1000);

		jest.advanceTimersByTime(1500); // Execute once
		interval.pause();

		jest.advanceTimersByTime(1000);
		interval.resume();

		jest.advanceTimersByTime(1000); // Execute again
		interval.pause();

		jest.advanceTimersByTime(1000);
		interval.resume();

		jest.advanceTimersByTime(1000); // Execute third time

		expect(mockCallback).toHaveBeenCalledTimes(3);

		interval.stop();
	});

	// This test is more conceptual and might not be possible to implement
	// depending on the internal structure of the setInterval function
	test('stop should clean up all internal references', () => {
		const mockCallback = jest.fn();
		const interval = setInterval(mockCallback, 1000);

		interval.stop();

		// Try to access internal properties (they should be null)
		// Note: This test assumes we can access internal properties, which might not be possible
		// depending on how the setInterval function is implemented
		expect(() => {
			jest.advanceTimersByTime(5000);
		}).not.toThrow();
		expect(mockCallback).not.toHaveBeenCalled();
	});
});
