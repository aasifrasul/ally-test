import { act, renderHook } from '@testing-library/react-hooks';
import { useRefetchLifecycle } from '../useRefetchLifecycle';

describe('useRefetchLifecycle', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('refetches on focus when enabled and stale', () => {
		const refetch = jest.fn();
		renderHook(() =>
			useRefetchLifecycle({
				enabled: true,
				isStale: () => true,
				refetch,
			}),
		);

		act(() => {
			window.dispatchEvent(new Event('focus'));
		});

		expect(refetch).toHaveBeenCalledTimes(1);
	});

	it('does not refetch when disabled or fresh', () => {
		const disabledRefetch = jest.fn();
		const disabled = renderHook(() =>
			useRefetchLifecycle({
				enabled: false,
				isStale: () => true,
				refetch: disabledRefetch,
			}),
		);

		act(() => {
			window.dispatchEvent(new Event('focus'));
		});
		expect(disabledRefetch).not.toHaveBeenCalled();
		disabled.unmount();

		const freshRefetch = jest.fn();
		const fresh = renderHook(() =>
			useRefetchLifecycle({
				enabled: true,
				isStale: () => false,
				refetch: freshRefetch,
			}),
		);

		act(() => {
			window.dispatchEvent(new Event('focus'));
		});
		expect(freshRefetch).not.toHaveBeenCalled();
		fresh.unmount();
	});

	it('polls at the configured interval and stops after unmount', () => {
		const refetch = jest.fn();
		const { unmount } = renderHook(() =>
			useRefetchLifecycle({
				enabled: false,
				interval: 1000,
				isStale: () => true,
				refetch,
			}),
		);

		act(() => jest.advanceTimersByTime(1000));
		expect(refetch).toHaveBeenCalledTimes(1);

		unmount();
		act(() => jest.advanceTimersByTime(1000));
		expect(refetch).toHaveBeenCalledTimes(1);
	});
});
