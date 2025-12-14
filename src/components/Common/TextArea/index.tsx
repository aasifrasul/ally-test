import React from 'react';
import { safelyExecuteFunction } from '../../../utils/typeChecking';

interface TextAreaProps {
	label?: string;
	id: string;
	name: string;
	placeholder?: string;
	rows?: number;
	cols?: number;
	className?: string;
	required?: boolean;
	error?: string;
	maxLength?: number;
	callback?: (text: string) => void;
	disabled?: boolean;
	helperText?: string;
	resize?: 'none' | 'vertical' | 'horizontal' | 'both';
	variant?: 'default' | 'outlined' | 'filled';
	size?: 'sm' | 'md' | 'lg';
}

export default function TextArea({
	label,
	id,
	name,
	placeholder,
	rows = 4,
	cols,
	className = '',
	required = false,
	error,
	maxLength,
	callback,
	disabled = false,
	helperText,
	resize = 'vertical',
	variant = 'default',
	size = 'md',
}: TextAreaProps) {
	const [content, setContent] = React.useState('');
	const [isFocused, setIsFocused] = React.useState(false);

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const text = e.target.value;
		setContent(text);
		safelyExecuteFunction(callback, null, text);
	};

	const handleFocus = () => setIsFocused(true);
	const handleBlur = () => setIsFocused(false);

	// Base styles
	const baseStyles = `
		block w-full rounded-md border font-medium transition-all duration-200 ease-in-out
		focus:outline-none focus:ring-2 focus:ring-offset-1
		disabled:cursor-not-allowed disabled:opacity-50
	`;

	// Size variants
	const sizeStyles = {
		sm: 'px-3 py-2 text-sm',
		md: 'px-4 py-3 text-base',
		lg: 'px-5 py-4 text-lg',
	};

	// Variant styles
	const variantStyles = {
		default: `
			border-gray-300 bg-white text-gray-900 placeholder-gray-500
			hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500
			${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
		`,
		outlined: `
			border-2 border-gray-300 bg-transparent text-gray-900 placeholder-gray-500
			hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500
			${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
		`,
		filled: `
			border-transparent bg-gray-100 text-gray-900 placeholder-gray-500
			hover:bg-gray-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500
			${error ? 'bg-red-50 border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
		`,
	};

	// Resize styles
	const resizeStyles = {
		none: 'resize-none',
		vertical: 'resize-y',
		horizontal: 'resize-x',
		both: 'resize',
	};

	const textareaClasses = `
		${baseStyles}
		${sizeStyles[size]}
		${variantStyles[variant]}
		${resizeStyles[resize]}
	`
		.trim()
		.replace(/\s+/g, ' ');

	const labelClasses = `
		block text-sm font-semibold mb-2 transition-colors duration-200
		${error ? 'text-red-700' : isFocused ? 'text-blue-700' : 'text-gray-700'}
		${disabled ? 'text-gray-400' : ''}
	`;

	const containerClasses = `
		${className}
	`.trim();

	return (
		<div className={containerClasses}>
			{label && (
				<label htmlFor={id} className={labelClasses}>
					{label}
					{required && <span className="text-red-500 ml-1">*</span>}
				</label>
			)}

			<div className="relative">
				<textarea
					id={id}
					name={name}
					value={content}
					rows={rows}
					cols={cols}
					placeholder={placeholder}
					onChange={handleChange}
					onFocus={handleFocus}
					onBlur={handleBlur}
					className={textareaClasses}
					disabled={disabled}
					required={required}
					maxLength={maxLength}
					aria-label={label}
					aria-invalid={!!error}
					aria-errormessage={error ? `${id}-error` : undefined}
					aria-describedby={
						[
							helperText ? `${id}-helper` : '',
							error ? `${id}-error` : '',
							maxLength ? `${id}-count` : '',
						]
							.filter(Boolean)
							.join(' ') || undefined
					}
				/>

				{/* Character counter */}
				{maxLength && (
					<div className="absolute bottom-2 right-2 pointer-events-none">
						<span
							id={`${id}-count`}
							className={`text-xs font-medium ${
								content.length > maxLength * 0.9
									? content.length >= maxLength
										? 'text-red-500'
										: 'text-yellow-600'
									: 'text-gray-400'
							}`}
						>
							{content.length}/{maxLength}
						</span>
					</div>
				)}
			</div>

			{/* Helper text */}
			{helperText && !error && (
				<p id={`${id}-helper`} className="mt-2 text-sm text-gray-600">
					{helperText}
				</p>
			)}

			{/* Error message */}
			{error && (
				<p id={`${id}-error`} className="mt-2 text-sm text-red-600 flex items-center">
					<svg
						className="w-4 h-4 mr-1 flex-shrink-0"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							fillRule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
							clipRule="evenodd"
						/>
					</svg>
					{error}
				</p>
			)}
		</div>
	);
}
