import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { TextFieldProps } from './types';

import { useFormField } from '../../../hooks/Form/';

import { cn } from '../../../utils/common';

export const InputText = forwardRef<{ clear(): void }, TextFieldProps>((props, ref) => {
	const {
		name,
		label,
		initialValue = '',
		validate,
		placeholder,
		disabled = false,
		required = false,
		className,
		size = 'md',
		debounceMs,
		type = 'text',
		clearable = false,
		onChange,
		autoComplete,
		autoFocus = false,
		wrapperClassName,
	} = props;

	const id = props.id || `id-${name}`;

	const { value, error, touched, isValid, handleChange, reset, handleBlur } = useFormField({
		id,
		initialValue,
		validate,
		onChange,
		debounceMs,
	});
	const inputRef = useRef<React.RefObject<{ clear(): void; focus(): void }>>(null);

	const showClearButton = clearable && value?.length > 0 && !disabled;

	// Base input styles
	const inputBaseStyles =
		'w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed';

	// Size-specific styles
	const inputSizeStyles = {
		sm: 'text-sm py-1 px-2',
		md: 'py-2 px-3',
		lg: 'text-lg py-3 px-4',
	};

	// Error styles
	const inputErrorStyles =
		touched && !isValid ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : '';

	const focus = useCallback(() => {
		inputRef.current?.focus();
	}, [inputRef]);

	useImperativeHandle(ref, () => ({
		clear: () => reset(),
		focus,
		value,
	}));

	const component = (
		<>
			{label && (
				<label
					htmlFor={id}
					className={cn(
						'block text-sm font-medium mb-1 text-gray-700',
						required && "after:content-['*'] after:ml-0.5 after:text-red-500",
					)}
				>
					{label}
				</label>
			)}

			<div className="relative">
				<input
					type={type}
					id={id}
					ref={inputRef}
					name={name}
					value={value}
					onChange={handleChange}
					disabled={disabled}
					placeholder={placeholder}
					autoComplete={autoComplete}
					autoFocus={autoFocus}
					onBlur={handleBlur}
					className={cn(
						inputBaseStyles,
						inputSizeStyles[size],
						inputErrorStyles,
						showClearButton && 'pr-8', // Add padding for clear button
						className,
					)}
					aria-invalid={!isValid}
					aria-describedby={error ? `${id}-error` : undefined}
				/>

				{showClearButton && (
					<button
						type="button"
						onClick={reset}
						className={cn(
							'absolute right-2 top-1/2 transform -translate-y-1/2',
							'text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600',
							'w-4 h-4 flex items-center justify-center transition-colors duration-150',
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
								d="M9 3L3L9M3 3L9 9"
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

	return <div className={cn('space-y-1', wrapperClassName)}>{component}</div>;
});

InputText.displayName = 'InputText';
