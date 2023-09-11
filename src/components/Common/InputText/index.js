import React from 'react';

import useFormField from '../../../hooks/useFormField';

import { debounce } from '../../../utils/common';

const InputText = ({
	id,
	name,
	initialValue,
	validate,
	placeholder = '',
	callback,
	isCallbackDebounced = false,
	debounceDelay = 250,
}) => {
	const { value, onChange, reset, error } = useFormField(
		id,
		initialValue,
		validate,
		isCallbackDebounced ? debounce(callback, debounceDelay) : callback
	);

	// Reset the field value when the initialValue changes
	React.useEffect(() => {
		return () => reset();
	}, [reset]);

	return (
		<div>
			<input
				type="text"
				id={id}
				name={name}
				value={value}
				placeholder={placeholder}
				onChange={onChange}
			/>
			{error && <div className="error">{error}</div>}
		</div>
	);
};

export default InputText;
