import { type Validator } from '../../../hooks/Form/';

export type BaseFieldProps = {
	id?: string;
	name: string;
	label?: string;
	initialValue?: string;
	validate?: Validator;
	placeholder?: string;
	disabled?: boolean;
	required?: boolean;
	hideWrapper?: boolean;
	onChange?: (value: string) => void;
	className?: string;
	size?: 'sm' | 'md' | 'lg';
	debounceMs?: number;
};

export type EmailFieldProps = BaseFieldProps & {
	type: 'email';
	allowedDomains?: string[];
};

export type NumberFieldProps = BaseFieldProps & {
	type: 'number';
	min?: number;
	max?: number;
	precision?: number;
};

export type PhoneFieldProps = BaseFieldProps & {
	type: 'phone';
	format?: 'international' | 'national';
	country?: string;
};

export type MoneyFieldProps = BaseFieldProps & {
	type: 'money';
	currency?: string;
	locale?: string;
	min?: number;
	max?: number;
};

export type PasswordFieldProps = BaseFieldProps & {
	type: 'password';
	minLength?: number;
	requireNumbers?: boolean;
	requireSpecialChars?: boolean;
};

export type TextFieldProps = BaseFieldProps & {
	type?: string;
	maxLength?: number;
	minLength?: number;
};

// Union type of all possible field props
export type InputFieldProps =
	| TextFieldProps
	| EmailFieldProps
	| NumberFieldProps
	| PhoneFieldProps
	| MoneyFieldProps
	| PasswordFieldProps;
