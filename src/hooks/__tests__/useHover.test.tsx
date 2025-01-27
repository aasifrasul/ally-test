import { renderHook, act } from '@testing-library/react-hooks';
import { fireEvent } from '@testing-library/react';
import { useHover } from '../useHover';

describe('useHover', () => {
	let container: HTMLDivElement;

	beforeEach(() => {
		container = document.createElement('div');
		document.body.appendChild(container);
		jest.useFakeTimers();
	});

	afterEach(() => {
		document.body.removeChild(container);
		jest.useRealTimers();
	});

	it('should return a hoverRef and a boolean', () => {
		const { result } = renderHook(() => useHover());
		const { hoverRef, isHovered } = result.current;

		expect(hoverRef).toBeDefined();
		expect(typeof isHovered).toBe('boolean');
		expect(isHovered).toBe(false);
	});

	it('should set isHovered to true on mouseenter after enterDelay', () => {
		const { result } = renderHook(() => useHover({ enterDelay: 100 }));
		const { hoverRef, isHovered } = result.current;

		expect(isHovered).toBe(false);

		act(() => {
			Object.defineProperty(hoverRef, 'current', {
				value: container,
				writable: true,
			});
		});

		fireEvent.mouseEnter(container);

		expect(isHovered).toBe(false);

		act(() => {
			jest.advanceTimersByTime(100);
		});

		expect(isHovered).toBe(true);
	});

	it('should set isHovered to false on mouseleave after leaveDelay', () => {
		const { result } = renderHook(() => useHover({ leaveDelay: 100 }));
		const { hoverRef, isHovered } = result.current;

		act(() => {
			Object.defineProperty(hoverRef, 'current', {
				value: container,
				writable: true,
			});
		});

		fireEvent.mouseEnter(container);

		expect(isHovered).toBe(true);

		act(() => {
			fireEvent.mouseLeave(container);
		});

		expect(isHovered).toBe(true);

		act(() => {
			jest.advanceTimersByTime(100);
		});

		expect(isHovered).toBe(false);
	});

	it('should work without delays', () => {
		const { result } = renderHook(() => useHover());
		const { hoverRef, isHovered } = result.current;

		act(() => {
			Object.defineProperty(hoverRef, 'current', {
				value: container,
				writable: true,
			});
		});

		fireEvent.mouseEnter(container);

		expect(isHovered).toBe(true);

		act(() => {
			fireEvent.mouseLeave(container);
		});

		expect(isHovered).toBe(false);
	});
});
