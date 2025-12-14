import { useState, useCallback, useEffect, useRef, ChangeEvent } from 'react';
import { useDebouncedCallback } from '../';

import { ValidationResult, UseFormFieldProps, FormFieldState } from './types';
import { isFunction } from '../../utils/typeChecking';

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

	useEffect(() => {
		validation(initialValue);
	}, []);

	// validation and onChange handler
	const validation = useCallback(
		(value: string): void => {
			let validationResult: ValidationResult = { isValid: true };

			if (validate) {
				if (isFunction(validate)) {
					validationResult = validate(value);
				} else if (validate instanceof RegExp) {
					const isValid = validate.test(value);
					validationResult = {
						isValid,
						error: isValid ? undefined : customErrorMessage,
					};
				}
			}

			setState((prev) => ({
				...prev,
				error: validationResult.error,
				isValid: validationResult.isValid,
			}));

			if (onChange) {
				onChange(value, id, validationResult.isValid);
			}
		},
		[validate, onChange, id, customErrorMessage],
	);

	// Debounced validation
	const debouncedValidation = useDebouncedCallback(validation, debounceMs);

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
		(event: ChangeEvent<HTMLInputElement>): void => {
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

	const reset = useCallback((): void => {
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
		(newValue: string, markAsDirty = true): void => {
			setState((prev) => ({
				...prev,
				value: newValue,
				dirty: markAsDirty,
			}));
			debouncedValidation(newValue);
		},
		[debouncedValidation],
	);

	const setTouched = useCallback((touched: boolean = true): void => {
		setState((prevState): FormFieldState => {
			if (touched === prevState.touched) return prevState;
			return {
				...prevState,
				touched,
			};
		});
	}, []);

	const handleBlur = useCallback((): void => {
		setTouched(true);
	}, [setTouched]);

	return {
		value: state.value,
		error: state.error,
		touched: state.touched,
		dirty: state.dirty,
		isValid: state.isValid,
		handleChange,
		reset,
		setValue,
		setTouched,
		handleBlur,
	};
}
