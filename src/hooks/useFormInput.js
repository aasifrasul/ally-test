import React, { useState } from 'react';

function useFormInput(initialValue) {
	const [value, setValue] = useState(initialValue);

	const handleChange = (e) => setValue(e.target.value);
	const handleReset = () => setValue('');

	return {
		value,
		onChange: handleChange,
		onReset: handleReset,
	};
}

export default useFormInput;
