import React, { useEffect } from 'react';

import useFormField from '../../../hooks/useFormField';

import { useDebouncedCallback } from '../../../hooks/useDebouncedCallback/useDebouncedCallback';

const InputText = ({
	id,
	name,
	initialValue,
	validate,
	placeholder = '',
	debounceDelay = 250,
	disabled = false,
	onChange,
	inputTextRef,
}) => {
	const {
		value,
		onChange: internalOnChange,
		reset,
		error,
		setValue,
	} = useFormField(
		id,
		initialValue || inputTextRef?.current,
		validate,
		debounceDelay ? useDebouncedCallback(onChange, debounceDelay) : onChange,
	);

	useEffect(() => {
		setValue(initialValue);
	}, [initialValue]);

	// Create a new handler that calls both the internal and external onChange
	const handleChange = (e) => {
		internalOnChange(e);
		if (onChange) {
			onChange(e.target.value);
		}

		if (inputTextRef) {
			inputTextRef.current = e.target.value;
		}
	};

	return (
		<div>
			<input
				type="text"
				id={id}
				data-testid={id}
				name={name}
				value={value}
				placeholder={placeholder}
				onChange={handleChange}
				disabled={disabled}
			/>
			{error ? <div className="error">{error}</div> : null}
		</div>
	);
};

export default InputText;
