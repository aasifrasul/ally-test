import { useState, useCallback, useEffect } from 'react';

import { isFunction, isArray, safelyExecuteFunction } from '../utils/typeChecking';

export default function useFormField(id, initialValue, validate = null, callback = null) {
	const [value, setValue] = useState(initialValue);
	const [error, setError] = useState('');

	useEffect(() => {
		setValue(initialValue);
	}, [initialValue]);

	const onChange = (e) => {
		e.preventDefault();
		const newValue = e.target.value;

		setValue(newValue);

		let errors = '';

		if (newValue && validate) {
			if (isFunction(validate)) {
				errors = validate(newValue);
			} else {
				const matches = String(newValue).match(validate);

				if (!isArray(matches) || !matches[0]) {
					errors = 'Please add valid input';
				}
			}
		}

		setError(errors);

		if (!errors) {
			safelyExecuteFunction(callback, null, newValue, id);
		}
	};

	const reset = useCallback(() => {
		setValue(initialValue);
		setError('');
	}, [initialValue]);

	return { value, onChange, reset, error, setValue };
}
