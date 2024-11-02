import { forwardRef } from 'react';

import { EmailFieldProps } from './types';
import { PATTERNS } from '../../../hooks/Form/constants';
import { ValidationResult } from '../../../hooks/Form';
import { InputText } from './index';

export const EmailInput = forwardRef<HTMLInputElement, EmailFieldProps>((props, ref) => {
	const { allowedDomains, ...rest } = props;

	const validateEmail = (value: string): ValidationResult => {
		if (!value) return { isValid: false, error: 'Email is required' };
		if (!PATTERNS.email.test(value)) {
			return { isValid: false, error: 'Please enter a valid email address' };
		}
		if (allowedDomains) {
			const domain = value.split('@')[1];
			if (!allowedDomains.includes(domain)) {
				return {
					isValid: false,
					error: `Email must be from: ${allowedDomains.join(', ')}`,
				};
			}
		}
		return { isValid: true };
	};

	return <InputText ref={ref} {...rest} validate={validateEmail} type="email" />;
});

EmailInput.displayName = 'EmailInput';
