import { renderHook } from '@testing-library/react';
import { useIntersectionObserver } from '../useIntersectionObserver';

describe('useIntersectionObserver', () => {
	let mockObserver: {
		observe: jest.Mock;
		disconnect: jest.Mock;
	};

	beforeEach(() => {
		// Create fresh mock functions for each test
		mockObserver = {
			observe: jest.fn(),
			disconnect: jest.fn(),
		};

		// Mock the IntersectionObserver constructor
		global.IntersectionObserver = jest.fn().mockImplementation(function (
			callback: IntersectionObserverCallback,
			options?: IntersectionObserverInit,
		) {
			return mockObserver;
		});
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should create an observer with default options', () => {
		const onIntersect = jest.fn();
		const { result } = renderHook(() => useIntersectionObserver({ onIntersect }));

		const target = document.createElement('div');
		result.current(target);

		expect(global.IntersectionObserver).toHaveBeenCalledWith(onIntersect, {
			threshold: 0,
			rootMargin: '0px',
			root: null,
		});
		expect(mockObserver.observe).toHaveBeenCalledWith(target);
	});

	it('should create an observer with custom options', () => {
		const onIntersect = jest.fn();
		const customRoot = document.createElement('div');
		const { result } = renderHook(() =>
			useIntersectionObserver({
				onIntersect,
				threshold: 0.5,
				rootMargin: '10px',
				root: customRoot,
			}),
		);

		const target = document.createElement('div');
		result.current(target);

		expect(global.IntersectionObserver).toHaveBeenCalledWith(onIntersect, {
			threshold: 0.5,
			rootMargin: '10px',
			root: customRoot,
		});
		expect(mockObserver.observe).toHaveBeenCalledWith(target);
	});

	it('should disconnect previous observer when observing new target', () => {
		const onIntersect = jest.fn();
		const { result } = renderHook(() => useIntersectionObserver({ onIntersect }));

		const target1 = document.createElement('div');
		const target2 = document.createElement('div');

		result.current(target1);
		result.current(target2);

		expect(mockObserver.disconnect).toHaveBeenCalledTimes(1);
		expect(global.IntersectionObserver).toHaveBeenCalledTimes(2);
		expect(mockObserver.observe).toHaveBeenCalledTimes(2);
		expect(mockObserver.observe).toHaveBeenLastCalledWith(target2);
	});

	it('should disconnect observer on unmount', () => {
		const onIntersect = jest.fn();
		const { result, unmount } = renderHook(() => useIntersectionObserver({ onIntersect }));

		const target = document.createElement('div');
		result.current(target);

		unmount();

		expect(mockObserver.disconnect).toHaveBeenCalledTimes(1);
	});

	it('should recreate observer when dependencies change', () => {
		const onIntersect1 = jest.fn();
		const onIntersect2 = jest.fn();

		const { result, rerender } = renderHook(
			({ onIntersect }) => useIntersectionObserver({ onIntersect }),
			{ initialProps: { onIntersect: onIntersect1 } },
		);

		const target = document.createElement('div');
		result.current(target);

		// Rerender with new callback
		rerender({ onIntersect: onIntersect2 });
		result.current(target);

		expect(mockObserver.disconnect).toHaveBeenCalledTimes(1);
		expect(global.IntersectionObserver).toHaveBeenCalledTimes(2);
		expect(global.IntersectionObserver).toHaveBeenLastCalledWith(
			onIntersect2,
			expect.any(Object),
		);
	});
});
