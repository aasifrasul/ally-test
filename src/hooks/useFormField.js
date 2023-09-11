import { useState, useCallback } from 'react';

export default function useFormField(id, initialValue, validate = null, callback = null) {
	const [value, setValue] = useState(initialValue);
	const [error, setError] = useState('');

	const handleChange = (e) => {
		const newValue = e.target.value;
		setValue(newValue);

		let errors;

		if (validate) {
			errors = validate(newValue);
			errors && setError(errors);
		}

		if (!error && callback) {
			callback(newValue, id);
		}
	};

	const reset = useCallback(() => {
		setValue(initialValue);
		setError('');
	}, [initialValue]);

	return { value, onChange: handleChange, reset, error };
}
