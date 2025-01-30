import React from 'react';

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
}

export default function TextArea({
	label,
	id,
	name,
	placeholder,
	rows,
	cols,
	className,
	required,
	error,
	maxLength,
	callback,
}: TextAreaProps) {
	const [content, setContent] = React.useState('');

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const text = e.target.value;
		setContent(text);
		if (typeof callback === 'function') {
			callback(text);
		}
	};

	return (
		<label className={className}>
			{label}
			<textarea
				id={id}
				name={name}
				value={content}
				rows={rows}
				cols={cols}
				placeholder={placeholder}
				onChange={handleChange}
				aria-label={label}
				required={required}
				maxLength={maxLength}
				aria-invalid={!!error}
				aria-errormessage={error ? `${id}-error` : undefined}
			/>
			{error && (
				<span id={`${id}-error`} className="error">
					{error}
				</span>
			)}
		</label>
	);
}
