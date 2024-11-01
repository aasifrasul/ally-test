import { useFormField } from './useFormField';

import { UseFormFieldProps } from './types';

export function usePasswordField(
	props: UseFormFieldProps & {
		minLength?: number;
		requireNumbers?: boolean;
		requireSpecialChars?: boolean;
		requireUppercase?: boolean;
		requireLowercase?: boolean;
	},
) {
	const {
		minLength = 8,
		requireNumbers = true,
		requireSpecialChars = true,
		requireUppercase = true,
		requireLowercase = true,
		...fieldProps
	} = props;

	return useFormField({
		...fieldProps,
		validate: (value) => {
			const errors: string[] = [];

			if (value.length < minLength) {
				errors.push(`Password must be at least ${minLength} characters long`);
			}
			if (requireNumbers && !/\d/.test(value)) {
				errors.push('Password must contain at least one number');
			}
			if (requireSpecialChars && !/[!@#$%^&*]/.test(value)) {
				errors.push('Password must contain at least one special character');
			}
			if (requireUppercase && !/[A-Z]/.test(value)) {
				errors.push('Password must contain at least one uppercase letter');
			}
			if (requireLowercase && !/[a-z]/.test(value)) {
				errors.push('Password must contain at least one lowercase letter');
			}

			return {
				isValid: errors.length === 0,
				error: errors.join('. '),
			};
		},
	});
}
