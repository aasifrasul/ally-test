import { renderHook } from '@testing-library/react-hooks';
import useIsMounted from '../useIsMounted';

describe('useIsMounted', () => {
	test('should return true when component is mounted', () => {
		const { result } = renderHook(() => useIsMounted());
		expect(result.current).toBe(true);
	});

	test('should return false when component is unmounted', () => {
		const { result, unmount } = renderHook(() => useIsMounted());
		unmount();
		expect(result.current).toBe(false);
	});

	test('should return true when component is re-mounted', () => {
		const { result, rerender } = renderHook(() => useIsMounted());
		rerender();
		expect(result.current).toBe(true);
	});
});
