import { renderHook, act } from '@testing-library/react-hooks';
import useFormField from '../useFormField';

test('should initialize with initial value', () => {
	const { result } = renderHook(() => useFormField('testField', 'initialValue'));
	const { current } = result;

	expect(current.value).toBe('initialValue');
});

test('should update value on change', () => {
	const { result } = renderHook(() => useFormField('testField', 'initialValue'));
	const { current } = result;

	act(() => {
		current.onChange({ target: { value: 'newValue' }, preventDefault: () => {} });
	});

	expect(current.value).toBe('newValue');
});

test('should validate value', () => {
	const validate = (value) => (value.length > 5 ? '' : 'Too short');
	const { result } = renderHook(() => useFormField('testField', 'initialValue', validate));
	const { current } = result;

	act(() => {
		current.onChange({ target: { value: 'short' }, preventDefault: () => {} });
	});

	expect(current.error).toBe('Too short');

	act(() => {
		current.onChange({ target: { value: 'longEnough' }, preventDefault: () => {} });
	});

	expect(current.error).toBe('');
});
