import { forwardRef } from 'react';

import { TextFieldProps } from './types';

import { useFormField } from '../../../hooks/Form/';

import { cn } from '../../../utils/common';

export const InputText = forwardRef<HTMLInputElement, TextFieldProps>((props, ref) => {
	const {
		name,
		label,
		initialValue,
		validate,
		placeholder,
		disabled = false,
		required = false,
		hideWrapper = false,
		className,
		size = 'md',
		debounceMs,
		type = 'text',
		clearable = false,
		onChange,
	} = props;

	const id = props.id || `id-${name}`;
	const { value, error, touched, isValid, handleChange } = useFormField({
		id,
		initialValue,
		validate,
		onChange,
		debounceMs,
	});

	const handleClear = () => {
		const event = {
			target: { value: '' },
		} as React.ChangeEvent<HTMLInputElement>;
		handleChange(event);
	};

	const showClearButton = clearable && value && value.length > 0 && !disabled;

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

			<div className="relative">
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
						showClearButton && 'pr-8', // Add padding for clear button
						touched && !isValid && 'error',
						className,
					)}
					aria-invalid={!isValid}
					aria-describedby={error ? `${id}-error` : undefined}
				/>

				{showClearButton && (
					<button
						type="button"
						onClick={handleClear}
						className={cn(
							'absolute right-2 top-1/2 transform -translate-y-1/2',
							'text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600',
							'w-4 h-4 flex items-center justify-center',
							size === 'sm' && 'w-3 h-3 text-xs',
							size === 'lg' && 'w-5 h-5 text-base',
						)}
						aria-label="Clear input"
					>
						<svg
							width="100%"
							height="100%"
							viewBox="0 0 12 12"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M9 3L3 9M3 3L9 9"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</button>
				)}
			</div>

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
