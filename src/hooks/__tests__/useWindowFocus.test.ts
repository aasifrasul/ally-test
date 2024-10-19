import { renderHook, act } from '@testing-library/react-hooks';
import { useWindowFocus } from '../useWindowFocus';

// Mock useEventListener
jest.mock('../useEventListener', () => ({
	useEventListener: jest.fn((event, handler) => {
		if (event === 'focus') {
			(global as any).focusHandler = handler;
		} else if (event === 'blur') {
			(global as any).blurHandler = handler;
		}
	}),
}));

describe('useWindowFocus', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should return the initial focus state', () => {
		const mockHasFocus = jest.spyOn(document, 'hasFocus');
		mockHasFocus.mockReturnValue(true);

		const { result } = renderHook(() => useWindowFocus());

		expect(result.current).toBe(true);
		mockHasFocus.mockRestore();
	});

	it('should update focus state on focus event', () => {
		const { result } = renderHook(() => useWindowFocus());

		act(() => {
			(global as any).focusHandler();
		});

		expect(result.current).toBe(true);
	});

	it('should update focus state on blur event', () => {
		const { result } = renderHook(() => useWindowFocus());

		act(() => {
			(global as any).blurHandler();
		});

		expect(result.current).toBe(false);
	});

	it('should add event listeners for focus and blur', () => {
		renderHook(() => useWindowFocus());

		expect(require('../useEventListener').useEventListener).toHaveBeenCalledTimes(2);
		expect(require('../useEventListener').useEventListener).toHaveBeenCalledWith(
			'focus',
			expect.any(Function),
		);
		expect(require('../useEventListener').useEventListener).toHaveBeenCalledWith(
			'blur',
			expect.any(Function),
		);
	});
});
