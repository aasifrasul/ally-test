import { forwardRef } from 'react';

import { TextFieldProps } from './types';

import { useFormField } from '../../../hooks/Form/';

import { cn } from '../../../utils/common';

export const InputText = forwardRef<HTMLInputElement, TextFieldProps>((props, ref) => {
	const {
		id,
		name,
		label,
		initialValue,
		validate,
		placeholder,
		disabled = false,
		required = false,
		hideWrapper = false,
		onChange,
		className,
		size = 'md',
		debounceMs = 250,
		type = 'text',
	} = props;
	const { value, error, touched, dirty, isValid, handleChange } = useFormField({
		id,
		initialValue,
		validate,
		onChange,
		debounceMs,
	});

	const component = (
		<>
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
				type={type}
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
		</>
	);

	if (hideWrapper) {
		return component;
	}

	return <div className="input-wrapper">{component}</div>;
});

InputText.displayName = 'InputText';
