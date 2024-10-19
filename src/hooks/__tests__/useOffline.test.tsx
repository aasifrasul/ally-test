import { renderHook, act } from '@testing-library/react-hooks';
import { useOffline } from '../useOffline';

describe('useOffline', () => {
	const dispatchEvent = (event: Event) => {
		window.dispatchEvent(event);
	};

	it('should return false when online', () => {
		const { result } = renderHook(() => useOffline());
		expect(result.current).toBe(false);
	});

	it('should return true when offline', () => {
		const { result } = renderHook(() => useOffline());

		act(() => {
			dispatchEvent(new Event('offline'));
		});

		expect(result.current).toBe(true);
	});

	it('should switch between online and offline states', () => {
		const { result } = renderHook(() => useOffline());

		act(() => {
			dispatchEvent(new Event('offline'));
		});
		expect(result.current).toBe(true);

		act(() => {
			dispatchEvent(new Event('online'));
		});
		expect(result.current).toBe(false);
	});
});
