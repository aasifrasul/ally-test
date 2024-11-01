export type ValidationResult = {
	isValid: boolean;
	error?: string;
};

export type ValidatorFn = (value: string) => ValidationResult;
export type CallbackFn = (value: string, id: string) => void;
export type Validator = ValidatorFn | RegExp;

export interface FormFieldState {
	value: string;
	error?: string;
	touched: boolean;
	dirty: boolean;
	isValid: boolean;
}

export interface UseFormFieldProps {
	id: string;
	initialValue?: string;
	validate?: Validator;
	onChange?: CallbackFn;
	debounceMs?: number;
	customErrorMessage?: string;
}

export type NumberFieldOptions = {
	min?: number;
	max?: number;
	integer?: boolean;
	precision?: number;
};

export type MoneyFieldOptions = {
	currency?: string;
	locale?: string;
	min?: number;
	max?: number;
};
