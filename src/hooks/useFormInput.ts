import React, { useState } from 'react';

interface UseFormInputReturn {
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onReset: () => void;
}

function useFormInput(initialValue: string): UseFormInputReturn {
	const [value, setValue] = useState<string>(initialValue);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value);
	const handleReset = () => setValue('');

	return {
		value,
		onChange: handleChange,
		onReset: handleReset,
	};
}

export default useFormInput;
