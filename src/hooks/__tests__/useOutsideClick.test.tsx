import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { useClickOutside } from '../useClickOutside';
import { useEventListener } from '../EventListeners/';

// Mock useEventListener
jest.mock('../useEventListener');

// Mock component using the hook
const TestComponent: React.FC = () => {
	const { isOutsideClick, outsideRef } = useClickOutside<HTMLDivElement>();
	return (
		<div>
			<div ref={outsideRef} data-testid="inside">
				Inside
			</div>
			<div data-testid="outside">Outside</div>
			<div data-testid="status">
				{isOutsideClick ? 'Clicked Outside' : 'Not Clicked Outside'}
			</div>
		</div>
	);
};

describe('useClickOutside', () => {
	beforeEach(() => {
		(useEventListener as jest.Mock).mockImplementation((eventType, handler) => {
			document.addEventListener(eventType, handler);
			return () => {
				document.removeEventListener(eventType, handler);
			};
		});
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should initialize with false', () => {
		const { result } = renderHook(() => useClickOutside());
		expect(result.current.isOutsideClick).toBe(false);
	});

	it('should detect click outside', () => {
		const { getByTestId } = render(<TestComponent />);
		const outsideElement = getByTestId('outside');
		const statusElement = getByTestId('status');

		expect(statusElement.textContent).toBe('Not Clicked Outside');

		act(() => {
			fireEvent.mouseDown(outsideElement);
		});

		expect(statusElement.textContent).toBe('Clicked Outside');
	});

	it('should not detect click inside', () => {
		const { getByTestId } = render(<TestComponent />);
		const insideElement = getByTestId('inside');
		const statusElement = getByTestId('status');

		expect(statusElement.textContent).toBe('Not Clicked Outside');

		act(() => {
			fireEvent.mouseDown(insideElement);
		});

		expect(statusElement.textContent).toBe('Not Clicked Outside');
	});

	it('should work with custom event type', () => {
		const { result } = renderHook(() => useClickOutside(false, 'click'));
		const { isOutsideClick, outsideRef } = result.current;

		const div = document.createElement('div');
		// @ts-ignore - we know outsideRef.current will be null initially
		outsideRef.current = div;
		document.body.appendChild(div);

		act(() => {
			fireEvent.click(document.body);
		});

		expect(isOutsideClick).toBe(true);

		act(() => {
			fireEvent.click(div);
		});

		expect(isOutsideClick).toBe(false);

		document.body.removeChild(div);
	});

	it('should clean up event listener on unmount', () => {
		const cleanupMock = jest.fn();
		(useEventListener as jest.Mock).mockReturnValue(cleanupMock);

		const { unmount } = renderHook(() => useClickOutside());

		unmount();

		expect(cleanupMock).toHaveBeenCalled();
	});
});
