import { renderHook, act } from '@testing-library/react-hooks';
import { useFormField } from '../Form/useFormField';

describe('useFormField', () => {
	it('initializes with the given value', () => {
		const { result } = renderHook(() =>
			useFormField({
				id: 'test',
				initialValue: 'initial',
			}),
		);
		expect(result.current.value).toBe('initial');
	});

	it('updates value on change', () => {
		const { result } = renderHook(() =>
			useFormField({
				id: 'test',
				initialValue: '',
			}),
		);
		act(() => {
			result.current.handleChange({
				target: { value: 'new value' },
			} as React.ChangeEvent<HTMLInputElement>);
		});
		expect(result.current.value).toBe('new value');
	});

	it('resets to initial value', () => {
		const { result } = renderHook(() =>
			useFormField({
				id: 'test',
				initialValue: 'initial',
			}),
		);
		act(() => {
			result.current.handleChange({
				target: { value: 'new value' },
			} as React.ChangeEvent<HTMLInputElement>);
		});
		expect(result.current.value).toBe('new value');
		act(() => {
			result.current.reset();
		});
		expect(result.current.value).toBe('initial');
	});

	it('validates using function', async () => {
		const validate = jest.fn((value) => ({
			isValid: value.length >= 3,
			error: value.length < 3 ? 'Too short' : undefined,
		}));

		const { result } = renderHook(() =>
			useFormField({
				id: 'test',
				initialValue: '',
				validate,
			}),
		);

		act(() => {
			result.current.handleChange({
				target: { value: 'ab' },
			} as React.ChangeEvent<HTMLInputElement>);
		});

		// Wait for debounce
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(result.current.error).toBe('Too short');

		act(() => {
			result.current.handleChange({
				target: { value: 'abc' },
			} as React.ChangeEvent<HTMLInputElement>);
		});

		// Wait for debounce
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(result.current.error).toBeUndefined();
	});

	it('validates using regex', async () => {
		const { result } = renderHook(() =>
			useFormField({
				id: 'test',
				initialValue: '',
				validate: /^[A-Z]+$/,
				customErrorMessage: 'Please add valid input',
			}),
		);

		act(() => {
			result.current.handleChange({
				target: { value: 'abc' },
			} as React.ChangeEvent<HTMLInputElement>);
		});

		// Wait for debounce
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(result.current.error).toBe('Please add valid input');

		act(() => {
			result.current.handleChange({
				target: { value: 'ABC' },
			} as React.ChangeEvent<HTMLInputElement>);
		});

		// Wait for debounce
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(result.current.error).toBeUndefined();
	});

	it('calls callback on valid change', async () => {
		const onChange = jest.fn();
		const { result } = renderHook(() =>
			useFormField({
				id: 'test',
				initialValue: '',
				onChange,
			}),
		);

		act(() => {
			result.current.handleChange({
				target: { value: 'new value' },
			} as React.ChangeEvent<HTMLInputElement>);
		});

		// Wait for debounce
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(onChange).toHaveBeenCalledWith('new value', 'test');
	});

	it('does not call callback on invalid change', async () => {
		const onChange = jest.fn();
		const validate = jest.fn(() => ({
			isValid: false,
			error: 'Error',
		}));

		const { result } = renderHook(() =>
			useFormField({
				id: 'test',
				initialValue: '',
				validate,
				onChange,
			}),
		);

		act(() => {
			result.current.handleChange({
				target: { value: 'new value' },
			} as React.ChangeEvent<HTMLInputElement>);
		});

		// Wait for debounce
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(onChange).not.toHaveBeenCalled();
	});

	it('updates value when initialValue prop changes', () => {
		const { result, rerender } = renderHook(
			({ initialValue }) =>
				useFormField({
					id: 'test',
					initialValue,
				}),
			{ initialProps: { initialValue: 'initial' } },
		);

		expect(result.current.value).toBe('initial');

		rerender({ initialValue: 'updated' });
		expect(result.current.value).toBe('updated');
	});

	it('tracks touched and dirty states', () => {
		const { result } = renderHook(() =>
			useFormField({
				id: 'test',
				initialValue: 'initial',
			}),
		);

		expect(result.current.touched).toBe(false);
		expect(result.current.dirty).toBe(false);

		act(() => {
			result.current.handleChange({
				target: { value: 'new value' },
			} as React.ChangeEvent<HTMLInputElement>);
		});

		expect(result.current.touched).toBe(true);
		expect(result.current.dirty).toBe(true);
	});

	it('handles setValue updates', async () => {
		const onChange = jest.fn();
		const { result } = renderHook(() =>
			useFormField({
				id: 'test',
				initialValue: 'initial',
				onChange,
			}),
		);

		act(() => {
			result.current.setValue('new value');
		});

		expect(result.current.value).toBe('new value');
		expect(result.current.dirty).toBe(true);

		// Wait for debounce
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(onChange).toHaveBeenCalledWith('new value', 'test');
	});
});
