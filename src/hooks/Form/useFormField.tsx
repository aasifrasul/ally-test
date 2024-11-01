import { useState, useCallback, useEffect, ChangeEvent } from 'react';
import { debounce } from '../../utils/throttleAndDebounce';

import { ValidationResult, UseFormFieldProps, FormFieldState } from './types';

export function useFormField({
	id,
	initialValue = '',
	validate,
	onChange,
	debounceMs = 0,
	customErrorMessage = 'Invalid input',
}: UseFormFieldProps) {
	const [state, setState] = useState<FormFieldState>({
		value: initialValue,
		touched: false,
		dirty: false,
		isValid: true,
	});

	// Debounced validation and onChange handler
	const debouncedValidation = useCallback(
		debounce((value: string) => {
			let validationResult: ValidationResult = { isValid: true };

			if (validate) {
				if (typeof validate === 'function') {
					validationResult = validate(value);
				} else if (validate instanceof RegExp) {
					validationResult = {
						isValid: validate.test(value),
						error: validate.test(value) ? undefined : customErrorMessage,
					};
				}
			}

			setState((prev) => ({
				...prev,
				error: validationResult.error,
				isValid: validationResult.isValid,
			}));

			if (validationResult.isValid && onChange) {
				onChange(value, id);
			}
		}, debounceMs),
		[validate, onChange, id, customErrorMessage],
	);

	// Handle external value updates
	useEffect(() => {
		if (initialValue !== state.value && !state.dirty) {
			setState((prev) => ({
				...prev,
				value: initialValue,
			}));
		}
	}, [initialValue, state.dirty]);

	const handleChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			const newValue = event.target.value;

			setState((prev) => ({
				...prev,
				value: newValue,
				touched: true,
				dirty: true,
			}));

			debouncedValidation(newValue);
		},
		[debouncedValidation],
	);

	const reset = useCallback(() => {
		setState({
			value: initialValue,
			touched: false,
			dirty: false,
			isValid: true,
			error: undefined,
		});
	}, [initialValue]);

	return {
		value: state.value,
		error: state.error,
		touched: state.touched,
		dirty: state.dirty,
		isValid: state.isValid,
		handleChange,
		reset,
		setValue: useCallback(
			(newValue: string) => {
				setState((prev) => ({
					...prev,
					value: newValue,
					dirty: true,
				}));
				debouncedValidation(newValue);
			},
			[debouncedValidation],
		),
	};
}
