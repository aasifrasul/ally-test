import React, { useState, useEffect } from 'react';

import { safelyExecuteFunction } from '../../../utils/typeChecking';

const InputText = (props) => {
	const { label, name, inputTextRef, defaultValue, callback } = props;
	const [value, setValue] = useState(defaultValue || undefined);

	useEffect(() => {
		setValue(inputTextRef.current);
	}, [inputTextRef.current]);

	const handleChange = (e) => {
		e.preventDefault();
		const value = e.target.value;
		setValue(value);
		inputTextRef && (inputTextRef.current = value);
		safelyExecuteFunction(callback, null, value);
	};

	return (
		<label>
			{label}
			<input type="text" label={label} name={name} value={value} onChange={handleChange} />
		</label>
	);
};

export default InputText;
