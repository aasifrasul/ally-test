import { useFormField } from './useFormField';

import { UseFormFieldProps } from './types';
import { PATTERNS } from './constants';

export function useEmailField(props: UseFormFieldProps) {
	return useFormField({
		...props,
		validate: (value) => {
			if (!PATTERNS.email.test(value)) {
				return { isValid: false, error: 'Please enter a valid email address' };
			}
			return { isValid: true };
		},
	});
}
