import React, { useState, useEffect } from 'react';

import { safelyExecuteFunction } from '../../../utils/typeChecking';

const InputText = (props) => {
	const { label, name, inputTextRef } = props;
	const [value, setValue] = useState(inputTextRef.current || '');

	useEffect(() => {
		setValue(inputTextRef.current);
	}, [inputTextRef.current]);

	const onChange = (e) => {
		e.preventDefault();
		const value = e.target.value;
		setValue(value);
		inputTextRef && (inputTextRef.current = value);
		safelyExecuteFunction(props.onChangeCallback, null, value);
	};

	const onKeyDown = (e) => {
		safelyExecuteFunction(props.onKeyDown, null, e);
	};

	return (
		<label>
			{label}
			<input
				type="text"
				label={label}
				name={name}
				value={value}
				onChange={onChange}
				onKeyDown={onKeyDown}
			/>
		</label>
	);
};

export default InputText;
