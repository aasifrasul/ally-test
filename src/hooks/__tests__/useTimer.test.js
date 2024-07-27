import { renderHook, act } from '@testing-library/react-hooks';
import useTimer from '../useTimer';

jest.useFakeTimers();

describe('useTimer', () => {
	beforeEach(() => {
		jest.clearAllTimers();
	});

	test('should initialize timer with default value', () => {
		const { result } = renderHook(() => useTimer());

		expect(result.current.seconds).toBe(0);
		expect(result.current.fraction).toBe(0);
	});

	test('should update timer every second', () => {
		const { result } = renderHook(() => useTimer(1000));

		expect(result.current.seconds).toBe(0);
		expect(result.current.fraction).toBe(0);

		act(() => {
			jest.advanceTimersByTime(1000);
		});

		expect(result.current.seconds).toBe(1);
		expect(result.current.fraction).toBe(0);

		act(() => {
			jest.advanceTimersByTime(2000);
		});

		expect(result.current.seconds).toBe(3);
		expect(result.current.fraction).toBe(0);
	});

	test('should stop timer when handleStop is called', () => {
		const { result } = renderHook(() => useTimer(1000));

		act(() => {
			jest.advanceTimersByTime(1000);
		});

		expect(result.current.seconds).toBe(1);

		act(() => {
			result.current.handleStop();
			jest.advanceTimersByTime(1000);
		});

		expect(result.current.seconds).toBe(1);
	});

	test('should resume timer when handleResume is called', () => {
		const { result } = renderHook(() => useTimer(1000));

		act(() => {
			jest.advanceTimersByTime(1000);
		});

		expect(result.current.seconds).toBe(1);

		act(() => {
			result.current.handleStop();
			jest.advanceTimersByTime(1000);
		});

		expect(result.current.seconds).toBe(1);

		act(() => {
			result.current.handleResume();
			jest.advanceTimersByTime(1000);
		});

		expect(result.current.seconds).toBe(2);
	});

	test('should reset timer when handleReset is called', () => {
		const { result } = renderHook(() => useTimer(1000));

		act(() => {
			jest.advanceTimersByTime(2000);
		});

		expect(result.current.seconds).toBe(2);

		act(() => {
			result.current.handleReset();
		});

		expect(result.current.seconds).toBe(0);
		expect(result.current.fraction).toBe(0);
	});
});
