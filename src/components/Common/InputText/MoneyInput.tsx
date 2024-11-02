import { forwardRef } from 'react';

import { MoneyFieldProps } from './types';
import { InputText } from './index';

export const MoneyInput = forwardRef<HTMLInputElement, MoneyFieldProps>((props, ref) => {
	const { locale = 'en-US', currency = 'USD', min, max, ...rest } = props;

	const formatMoney = (value: string) => {
		const number = parseFloat(value.replace(/[^\d.-]/g, ''));
		if (isNaN(number)) return '';
		return new Intl.NumberFormat(locale, {
			style: 'currency',
			currency,
		}).format(number);
	};

	const validateMoney = (value: string) => {
		const number = parseFloat(value.replace(/[^\d.-]/g, ''));
		if (isNaN(number)) return { isValid: false, error: 'Invalid amount' };
		if (min !== undefined && number < min)
			return {
				isValid: false,
				error: `Minimum amount is ${formatMoney(min.toString())}`,
			};
		if (max !== undefined && number > max)
			return {
				isValid: false,
				error: `Maximum amount is ${formatMoney(max.toString())}`,
			};
		return { isValid: true };
	};

	return (
		<InputText
			ref={ref}
			onChange={(value) => {
				const formatted = formatMoney(value);
				props.onChange?.(formatted);
			}}
			{...rest}
			validate={validateMoney}
		/>
	);
});
