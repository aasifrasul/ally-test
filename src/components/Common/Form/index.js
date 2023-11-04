import React from 'react';

import { safelyExecuteFunction } from '../../../utils/typeChecking';

export default function Form({ name, children, onSubmit, defaultSubmit }) {
	const handleSubmit = (e) => {
		e.preventDefault();
		safelyExecuteFunction(onSubmit, null, e);
	};

	return (
		<form onSubmit={handleSubmit} name={name}>
			{children}
			{defaultSubmit ? <button type="submit">Submit</button> : null}
		</form>
	);
}
