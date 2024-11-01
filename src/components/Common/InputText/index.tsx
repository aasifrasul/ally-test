import { forwardRef } from 'react';

import { useFormField, type Validator } from '../../../hooks/Form/';
import { cn } from '../../../utils/common';

interface InputTextProps {
	id: string;
	name: string;
	label?: string;
	initialValue?: string;
	validate?: Validator;
	placeholder?: string;
	disabled?: boolean;
	required?: boolean;
	onChange?: (value: string) => void;
	className?: string;
	size?: 'sm' | 'md' | 'lg';
	debounceMs?: number;
}

const InputText = forwardRef<HTMLInputElement, InputTextProps>(
	(
		{
			id,
			name,
			label,
			initialValue,
			validate,
			placeholder,
			disabled,
			required,
			onChange,
			className,
			size = 'md',
			debounceMs = 250,
		},
		ref,
	) => {
		const { value, error, touched, dirty, isValid, handleChange } = useFormField({
			id,
			initialValue,
			validate,
			onChange,
			debounceMs,
		});

		return (
			<div className="form-field">
				{label && (
					<label
						htmlFor={id}
						className={cn(
							'block text-sm font-medium mb-1',
							required && "after:content-['*'] after:ml-0.5 after:text-red-500",
						)}
					>
						{label}
					</label>
				)}

				<input
					ref={ref}
					type="text"
					id={id}
					name={name}
					value={value}
					onChange={handleChange}
					disabled={disabled}
					placeholder={placeholder}
					className={cn(
						'input',
						size === 'sm' && 'text-sm py-1 px-2',
						size === 'md' && 'py-2 px-3',
						size === 'lg' && 'text-lg py-3 px-4',
						touched && !isValid && 'error',
						className,
					)}
					aria-invalid={!isValid}
					aria-describedby={error ? `${id}-error` : undefined}
				/>

				{touched && error && (
					<div id={`${id}-error`} className="text-red-500 text-sm mt-1" role="alert">
						{error}
					</div>
				)}
			</div>
		);
	},
);

InputText.displayName = 'InputText';

export default InputText;
