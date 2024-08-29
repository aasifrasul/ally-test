import { renderHook, act } from '@testing-library/react-hooks';
import useFormField from '../useFormField';

describe('useFormField', () => {
	it('initializes with the given value', () => {
		const { result } = renderHook(() => useFormField('test', 'initial'));
		expect(result.current.value).toBe('initial');
	});

	it('updates value on change', () => {
		const { result } = renderHook(() => useFormField('test', ''));
		act(() => {
			result.current.onChange({
				preventDefault: jest.fn(),
				target: { value: 'new value' },
			});
		});
		expect(result.current.value).toBe('new value');
	});

	it('resets to initial value', () => {
		const { result } = renderHook(() => useFormField('test', 'initial'));
		act(() => {
			result.current.onChange({
				preventDefault: jest.fn(),
				target: { value: 'new value' },
			});
		});
		expect(result.current.value).toBe('new value');
		act(() => {
			result.current.reset();
		});
		expect(result.current.value).toBe('initial');
	});

	it('validates using function', () => {
		const validate = jest.fn((value) => (value.length < 3 ? 'Too short' : ''));
		const { result } = renderHook(() => useFormField('test', '', validate));
		act(() => {
			result.current.onChange({ preventDefault: jest.fn(), target: { value: 'ab' } });
		});
		expect(result.current.error).toBe('Too short');
		act(() => {
			result.current.onChange({ preventDefault: jest.fn(), target: { value: 'abc' } });
		});
		expect(result.current.error).toBe('');
	});

	it('validates using regex', () => {
		const { result } = renderHook(() => useFormField('test', '', /^[A-Z]+$/));
		act(() => {
			result.current.onChange({ preventDefault: jest.fn(), target: { value: 'abc' } });
		});
		expect(result.current.error).toBe('Please add valid input');
		act(() => {
			result.current.onChange({ preventDefault: jest.fn(), target: { value: 'ABC' } });
		});
		expect(result.current.error).toBe('');
	});

	it('calls callback on valid change', () => {
		const callback = jest.fn();
		const { result } = renderHook(() => useFormField('test', '', null, callback));
		act(() => {
			result.current.onChange({
				preventDefault: jest.fn(),
				target: { value: 'new value' },
			});
		});
		expect(callback).toHaveBeenCalledWith('new value', 'test');
	});

	it('does not call callback on invalid change', () => {
		const callback = jest.fn();
		const validate = jest.fn(() => 'Error');
		const { result } = renderHook(() => useFormField('test', '', validate, callback));
		act(() => {
			result.current.onChange({
				preventDefault: jest.fn(),
				target: { value: 'new value' },
			});
		});
		expect(callback).not.toHaveBeenCalled();
	});

	it('updates value when initialValue prop changes', () => {
		const { result, rerender } = renderHook(
			({ initialValue }) => useFormField('test', initialValue),
			{ initialProps: { initialValue: 'initial' } },
		);
		expect(result.current.value).toBe('initial');

		rerender({ initialValue: 'updated' });
		expect(result.current.value).toBe('updated');
	});
});
