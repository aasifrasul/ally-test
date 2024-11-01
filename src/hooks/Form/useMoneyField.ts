import { useFormField } from './useFormField';

import { UseFormFieldProps, MoneyFieldOptions } from './types';

export function useMoneyField(props: UseFormFieldProps & MoneyFieldOptions) {
	const { currency = 'USD', locale = 'en-US', min, max, ...fieldProps } = props;

	const formatter = new Intl.NumberFormat(locale, {
		style: 'currency',
		currency,
	});

	return useFormField({
		...fieldProps,
		validate: (value) => {
			const numericValue = Number(value.replace(/[^0-9.-]/g, ''));

			if (isNaN(numericValue)) {
				return { isValid: false, error: 'Please enter a valid amount' };
			}

			if (min !== undefined && numericValue < min) {
				return {
					isValid: false,
					error: `Amount must be at least ${formatter.format(min)}`,
				};
			}

			if (max !== undefined && numericValue > max) {
				return {
					isValid: false,
					error: `Amount must be no more than ${formatter.format(max)}`,
				};
			}

			return {
				isValid: true,
				transformedValue: formatter.format(numericValue),
			};
		},
	});
}
