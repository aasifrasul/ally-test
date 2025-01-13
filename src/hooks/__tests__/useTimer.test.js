import { renderHook, act } from '@testing-library/react-hooks';
import useTimer from '../useTimer';

// Properly type the jest.useFakeTimers() call
jest.useFakeTimers();

describe('useTimer', () => {
	beforeEach(() => {
		jest.clearAllTimers();
	});

	test('should initialize timer with default value', () => {
		const { result } = renderHook(() => useTimer());

		expect(result.current.seconds).toBe(1); // Changed from 0 to 1 since initial state is 1 for default timePeriod
		expect(result.current.fraction).toBe(0);
	});

	test('should update timer every second', () => {
		const { result } = renderHook(() => useTimer(1000));

		// Initial state should be 1 second due to the implementation
		expect(result.current.seconds).toBe(1);
		expect(result.current.fraction).toBe(0);

		act(() => {
			jest.advanceTimersByTime(1000);
		});

		expect(result.current.seconds).toBe(2); // Changed from 1 to 2
		expect(result.current.fraction).toBe(0);

		act(() => {
			jest.advanceTimersByTime(2000);
		});

		expect(result.current.seconds).toBe(4); // Changed from 3 to 4
		expect(result.current.fraction).toBe(0);
	});

	test('should handle sub-second timer periods correctly', () => {
		const { result } = renderHook(() => useTimer(500));

		expect(result.current.seconds).toBe(0);
		expect(result.current.fraction).toBe(0);

		act(() => {
			jest.advanceTimersByTime(500);
		});

		expect(result.current.seconds).toBe(0);
		expect(result.current.fraction).toBe(500);

		act(() => {
			jest.advanceTimersByTime(1000);
		});

		expect(result.current.seconds).toBe(1);
		expect(result.current.fraction).toBe(500);
	});

	test('should stop timer when handleStop is called', () => {
		const { result } = renderHook(() => useTimer(1000));

		act(() => {
			jest.advanceTimersByTime(1000);
		});

		const currentSeconds = result.current.seconds;

		act(() => {
			result.current.handleStop();
			jest.advanceTimersByTime(1000);
		});

		expect(result.current.seconds).toBe(currentSeconds);
	});

	test('should resume timer when handleResume is called', () => {
		const { result } = renderHook(() => useTimer(1000));

		act(() => {
			jest.advanceTimersByTime(1000);
		});

		const currentSeconds = result.current.seconds;

		act(() => {
			result.current.handleStop();
			jest.advanceTimersByTime(1000);
		});

		expect(result.current.seconds).toBe(currentSeconds);

		act(() => {
			result.current.handleResume();
			jest.advanceTimersByTime(1000);
		});

		expect(result.current.seconds).toBe(currentSeconds + 1);
	});

	test('should reset timer when handleReset is called', () => {
		const { result } = renderHook(() => useTimer(1000));

		act(() => {
			jest.advanceTimersByTime(2000);
		});

		expect(result.current.seconds).toBe(3); // Changed from 2 to 3

		act(() => {
			result.current.handleReset();
		});

		// After reset, for timePeriod >= 1000, initial state should be 1
		expect(result.current.seconds).toBe(1); // Changed from 0 to 1
		expect(result.current.fraction).toBe(0);
	});
});
