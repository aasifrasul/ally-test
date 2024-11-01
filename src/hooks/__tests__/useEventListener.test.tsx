import { renderHook } from '@testing-library/react-hooks';
import { fireEvent, act } from '@testing-library/react';
import { useEventListener } from '../useEventListener';

describe('useEventListener', () => {
	// Clear all mocks before each test
	beforeEach(() => {
		jest.clearAllMocks();
	});

	// Test 1: Basic window event listener
	it('should attach and detach window event listener', () => {
		const mockCallback = jest.fn();
		const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
		const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

		const { unmount } = renderHook(() => useEventListener('click', mockCallback, window));

		expect(addEventListenerSpy).toHaveBeenCalledWith(
			'click',
			expect.any(Function),
			undefined,
		);

		act(() => {
			fireEvent.click(window);
		});

		expect(mockCallback).toHaveBeenCalledTimes(1);

		unmount();
		expect(removeEventListenerSpy).toHaveBeenCalled();

		addEventListenerSpy.mockRestore();
		removeEventListenerSpy.mockRestore();
	});

	// Test 2: Custom element event listener
	it('should attach and detach element event listener', () => {
		const mockCallback = jest.fn();
		const element = document.createElement('div');

		const addEventListenerSpy = jest.spyOn(element, 'addEventListener');
		const removeEventListenerSpy = jest.spyOn(element, 'removeEventListener');

		const { unmount } = renderHook(() => useEventListener('click', mockCallback, element));

		expect(addEventListenerSpy).toHaveBeenCalledWith(
			'click',
			expect.any(Function),
			undefined,
		);

		act(() => {
			fireEvent.click(element);
		});

		expect(mockCallback).toHaveBeenCalledTimes(1);

		unmount();
		expect(removeEventListenerSpy).toHaveBeenCalled();

		addEventListenerSpy.mockRestore();
		removeEventListenerSpy.mockRestore();
	});

	// Test 3: Test with options
	it('should pass options to event listener', () => {
		const mockCallback = jest.fn();
		const options = { capture: true };
		const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

		renderHook(() => useEventListener('click', mockCallback, window, options));

		expect(addEventListenerSpy).toHaveBeenCalledWith(
			'click',
			expect.any(Function),
			options,
		);

		addEventListenerSpy.mockRestore();
	});

	// Test 4: Test null element handling
	it('should handle null element gracefully', () => {
		const mockCallback = jest.fn();
		const element = document.createElement('div');
		document.body.appendChild(element);

		// Start with the element
		const { rerender } = renderHook(
			({ el }: { el: HTMLDivElement | null }) =>
				useEventListener('click', mockCallback, el),
			{ initialProps: { el: element as HTMLDivElement | null } },
		);

		// Reset the mock calls count after initial setup
		mockCallback.mockClear();

		// Now rerender with null element
		rerender({ el: null } as { el: HTMLDivElement | null });

		// Dispatch a new click event on the document
		act(() => {
			const clickEvent = new MouseEvent('click', {
				bubbles: true,
				cancelable: true,
				view: window,
			});
			document.dispatchEvent(clickEvent);
		});

		// The callback should not have been called
		expect(mockCallback).not.toHaveBeenCalled();

		// Cleanup
		document.body.removeChild(element);
	});

	// Test 5: Test callback updates
	it('should use updated callback', () => {
		const firstCallback = jest.fn();
		const secondCallback = jest.fn();

		const { rerender } = renderHook(
			({ callback }) => useEventListener('click', callback, window),
			{ initialProps: { callback: firstCallback } },
		);

		act(() => {
			fireEvent.click(window);
		});

		expect(firstCallback).toHaveBeenCalledTimes(1);
		expect(secondCallback).not.toHaveBeenCalled();

		rerender({ callback: secondCallback });

		act(() => {
			fireEvent.click(window);
		});

		expect(secondCallback).toHaveBeenCalledTimes(1);
	});

	// Test 6: Test SSR compatibility
	it('should handle SSR environment', () => {
		const mockCallback = jest.fn();
		const originalWindow = global.window;

		delete (global as any).window;

		expect(() => {
			renderHook(() => useEventListener('click', mockCallback, window));
		}).not.toThrow();

		(global as any).window = originalWindow;
	});

	// Test 7: Test cleanup when element changes
	it('should cleanup listeners when element changes', () => {
		const mockCallback = jest.fn();
		const element1 = document.createElement('div');
		const element2 = document.createElement('div');

		const removeEventListener1 = jest.spyOn(element1, 'removeEventListener');
		const addEventListener2 = jest.spyOn(element2, 'addEventListener');

		const { rerender } = renderHook(
			({ el }) => useEventListener('click', mockCallback, el),
			{ initialProps: { el: element1 } },
		);

		rerender({ el: element2 });

		expect(removeEventListener1).toHaveBeenCalled();
		expect(addEventListener2).toHaveBeenCalled();

		removeEventListener1.mockRestore();
		addEventListener2.mockRestore();
	});
});
