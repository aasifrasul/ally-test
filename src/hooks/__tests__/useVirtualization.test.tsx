import { renderHook, act } from '@testing-library/react-hooks';

import { useVirtualization } from '../useVirtualization';

describe('useVirtualization', () => {
	beforeEach(() => {
		(
			globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
		).IS_REACT_ACT_ENVIRONMENT = true;

		jest.spyOn(window, 'requestAnimationFrame').mockImplementation(
			(callback: FrameRequestCallback) => {
				callback(Date.now());
				return 1;
			},
		);
		jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);

		class ResizeObserverMock {
			observe() {}
			unobserve() {}
			disconnect() {}
		}

		Object.defineProperty(window, 'ResizeObserver', {
			configurable: true,
			value: ResizeObserverMock,
		});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('recomputes visible content when renderItem changes', () => {
		const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];

		const { result, rerender } = renderHook(
			({ renderItem }) =>
				useVirtualization({
					items,
					itemHeight: 100,
					renderItem,
				}),
			{
				initialProps: {
					renderItem: (item: { id: string }) => item.id,
				},
			},
		);

		expect(result.current.visibleContent).toEqual(['a', 'b', 'c']);

		act(() => {
			rerender({
				renderItem: (item: { id: string }) => item.id.toUpperCase(),
			});
		});

		expect(result.current.visibleContent).toEqual(['A', 'B', 'C']);
	});
});
