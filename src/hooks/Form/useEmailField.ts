import { useFormField } from './useFormField';

import { UseFormFieldProps, ValidationResult } from './types';
import { PATTERNS } from './constants';

export function useEmailField(props: UseFormFieldProps) {
	return useFormField({
		...props,
		validate: (value: string): ValidationResult => {
			if (!PATTERNS.email.test(value)) {
				return { isValid: false, error: 'Please enter a valid email address' };
			}
			return { isValid: true };
		},
	});
}
