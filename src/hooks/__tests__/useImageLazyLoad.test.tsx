import { renderHook } from '@testing-library/react';
import { useImageLazyLoad } from '../useImageLazyLoad';

describe('useImageLazyLoad', () => {
	beforeEach(() => {
		// IntersectionObserver isn't available in test environment
		const mockIntersectionObserver = jest.fn();
		mockIntersectionObserver.mockReturnValue({
			observe: () => null,
			unobserve: () => null,
			disconnect: () => null,
		});
		window.IntersectionObserver = mockIntersectionObserver;
	});

	it('should create an IntersectionObserver', () => {
		const observeMock = jest.fn();
		const unobserveMock = jest.fn();
		const disconnectMock = jest.fn();

		window.IntersectionObserver = jest.fn(function (callback, options) {
			this.observe = observeMock;
			this.unobserve = unobserveMock;
			this.disconnect = disconnectMock;
		});

		const { result } = renderHook(() =>
			useImageLazyLoad({
				imgSelector: 'img',
				count: 10,
			}),
		);

		expect(window.IntersectionObserver).toHaveBeenCalledWith(expect.any(Function), {
			threshold: 0.5,
		});
		expect(observeMock).toHaveBeenCalled();
		expect(result.current).toBeUndefined();
	});

	it('should handle intersection events correctly', () => {
		const observeMock = jest.fn();
		const unobserveMock = jest.fn();
		const disconnectMock = jest.fn();

		window.IntersectionObserver = jest.fn(function (callback, options) {
			this.observe = observeMock;
			this.unobserve = unobserveMock;
			this.disconnect = disconnectMock;

			// Simulate intersection event
			callback([{ intersectionRatio: 1, target: { dataset: { src: 'image.jpg' } } }]);
		});

		const { result } = renderHook(() => useImageLazyLoad('img', 10));

		expect(observeMock).toHaveBeenCalled();
		expect(unobserveMock).toHaveBeenCalled();
		expect(disconnectMock).toHaveBeenCalled();
		expect(result.current).toBeUndefined();
	});
});
