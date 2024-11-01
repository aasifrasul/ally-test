import { useFormField } from './useFormField';

import { UseFormFieldProps, NumberFieldOptions } from './types';

export function useNumberField(props: UseFormFieldProps & NumberFieldOptions) {
	const { min, max, integer = false, precision = 2, ...fieldProps } = props;

	return useFormField({
		...fieldProps,
		validate: (value) => {
			const num = Number(value);

			if (isNaN(num)) {
				return { isValid: false, error: 'Please enter a valid number' };
			}

			if (integer && !Number.isInteger(num)) {
				return { isValid: false, error: 'Please enter a whole number' };
			}

			if (min !== undefined && num < min) {
				return { isValid: false, error: `Value must be at least ${min}` };
			}

			if (max !== undefined && num > max) {
				return { isValid: false, error: `Value must be no more than ${max}` };
			}

			// Format to specified precision
			const formatted = integer ? num : Number(num.toFixed(precision));

			return {
				isValid: true,
				transformedValue: String(formatted),
			};
		},
	});
}
