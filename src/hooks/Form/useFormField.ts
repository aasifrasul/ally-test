import { useState, useCallback, useEffect, useRef, ChangeEvent } from 'react';
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

	// Track the previous initialValue to detect actual changes
	const prevInitialValueRef = useRef(initialValue);

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

	// Handle initialValue changes (both when clean and dirty)
	useEffect(() => {
		// Only update if initialValue actually changed (not just different from current value)
		if (initialValue !== prevInitialValueRef.current) {
			setState((prev) => ({
				...prev,
				value: initialValue,
				dirty: false, // Reset dirty state on external update
			}));
			debouncedValidation(initialValue);
			prevInitialValueRef.current = initialValue;
		}
	}, [initialValue, debouncedValidation]);

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
		prevInitialValueRef.current = initialValue;
	}, [initialValue]);

	const setValue = useCallback(
		(newValue: string, markAsDirty = true) => {
			setState((prev) => ({
				...prev,
				value: newValue,
				dirty: markAsDirty,
			}));
			debouncedValidation(newValue);
		},
		[debouncedValidation],
	);

	return {
		value: state.value,
		error: state.error,
		touched: state.touched,
		dirty: state.dirty,
		isValid: state.isValid,
		handleChange,
		reset,
		setValue,
	};
}
