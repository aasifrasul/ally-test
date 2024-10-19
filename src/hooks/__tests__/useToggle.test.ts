import { renderHook, act } from '@testing-library/react-hooks';
import useToggle from '../useToggle';

describe('useToggle', () => {
	test('should initialize with false', () => {
		const { result } = renderHook(() => useToggle());
		expect(result.current[0]).toBe(false);
	});

	test('should toggle state when called without arguments', () => {
		const { result } = renderHook(() => useToggle());

		act(() => {
			result.current[1]();
		});
		expect(result.current[0]).toBe(true);

		act(() => {
			result.current[1]();
		});
		expect(result.current[0]).toBe(false);
	});

	test('should set state to the provided boolean value', () => {
		const { result } = renderHook(() => useToggle());

		act(() => {
			result.current[1](true);
		});
		expect(result.current[0]).toBe(true);

		act(() => {
			result.current[1](false);
		});
		expect(result.current[0]).toBe(false);
	});

	test('should not change state when provided with non-boolean values', () => {
		const { result } = renderHook(() => useToggle());

		act(() => {
			result.current[1](false as boolean | undefined);
		});
		expect(result.current[0]).toBe(false);

		act(() => {
			result.current[1](true);
		});
		expect(result.current[0]).toBe(true);
	});
});
