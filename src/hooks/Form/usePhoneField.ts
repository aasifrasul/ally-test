import { useFormField } from './useFormField';

import { UseFormFieldProps } from './types';
import { PATTERNS } from './constants';

export function usePhoneField(
	props: UseFormFieldProps & {
		format?: 'international' | 'national';
		country?: string;
	},
) {
	const { format = 'national', country = 'US', ...fieldProps } = props;

	return useFormField({
		...fieldProps,
		validate: (value) => {
			// Remove all non-numeric characters
			const numericValue = value.replace(/\D/g, '');

			if (!PATTERNS.phone.test(numericValue)) {
				return {
					isValid: false,
					error: 'Please enter a valid phone number',
				};
			}

			// Format phone number based on country and format
			//const formatted = formatPhoneNumber(numericValue, format, country);

			return {
				isValid: true,
				transformedValue: numericValue,
			};
		},
	});
}
