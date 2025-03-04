import { renderHook, act } from '@testing-library/react-hooks';
import { useTimer } from '../useTimer';
import { setupTimeMocks } from '../../utils/timeTestUtils';

// Mock Date.now for consistent testing
const mockDateNow = jest.fn();
const originalDateNow = Date.now;

describe('useTimer', () => {
	let timeUtils: ReturnType<typeof setupTimeMocks>;

	beforeEach(() => {
		// Reset mocks and timers
		jest.clearAllMocks();
		mockDateNow.mockReset();
		timeUtils = setupTimeMocks();

		// Mock requestAnimationFrame
		jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
			return setTimeout(() => cb(Date.now()), 16) as unknown as number;
		});

		// Mock cancelAnimationFrame
		jest.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
			clearTimeout(id as unknown as NodeJS.Timeout);
		});

		// Set up Date.now mock
		Date.now = mockDateNow;

		// Start with a base time
		const baseTime = 1000000;
		let currentTime = baseTime;
		mockDateNow.mockImplementation(() => currentTime);

		// Helper to advance time
		timeUtils.advanceTimersByTime = (ms) => {
			currentTime += ms;
			jest.advanceTimersByTime(ms);
		};
	});

	afterEach(() => {
		// Restore original implementations
		Date.now = originalDateNow;
		jest.restoreAllMocks();
	});

	test('should initialize timer with zero values', () => {
		const { result } = renderHook(() => useTimer());
		expect(result.current.seconds).toBe(0);
		expect(result.current.milliseconds).toBe(0);
	});

	test('should update timer as time advances', () => {
		const { result } = renderHook(() => useTimer());

		// Advance by 1 second
		act(() => {
			timeUtils.advanceTimersByTime(1000);
		});

		expect(result.current.seconds).toBe(1);
		expect(result.current.milliseconds).toBe(0);

		// Advance by 1.5 more seconds
		act(() => {
			timeUtils.advanceTimersByTime(1500);
		});

		expect(result.current.seconds).toBe(2);
		expect(result.current.milliseconds).toBe(500);
	});

	test('should stop timer when handleStop is called', () => {
		const { result } = renderHook(() => useTimer());

		// Advance by 1 second
		act(() => {
			timeUtils.advanceTimersByTime(1000);
		});

		expect(result.current.seconds).toBe(1);

		// Stop the timer
		act(() => {
			result.current.handleStop();
		});

		// Advance by another second, timer should not update
		act(() => {
			timeUtils.advanceTimersByTime(1000);
		});

		expect(result.current.seconds).toBe(1); // Still 1 second
	});

	test('should resume timer when handleResume is called', () => {
		const { result } = renderHook(() => useTimer());

		// Advance by 1 second
		act(() => {
			timeUtils.advanceTimersByTime(1000);
		});

		// Stop the timer
		act(() => {
			result.current.handleStop();
		});

		// Advance time while stopped
		act(() => {
			timeUtils.advanceTimersByTime(1000);
		});

		// Resume the timer
		act(() => {
			result.current.handleResume();
		});

		// Advance by another second
		act(() => {
			timeUtils.advanceTimersByTime(1000);
		});

		expect(result.current.seconds).toBe(2); // Should have advanced to 2 seconds
	});

	test('should reset timer when handleReset is called', () => {
		const { result } = renderHook(() => useTimer());

		// Advance by 2 seconds
		act(() => {
			timeUtils.advanceTimersByTime(2000);
		});

		expect(result.current.seconds).toBe(2);

		// Reset the timer
		act(() => {
			result.current.handleReset();
		});

		expect(result.current.seconds).toBe(0);
		expect(result.current.milliseconds).toBe(0);
	});
});
