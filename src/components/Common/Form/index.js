import React from 'react';

export default function Form({ name, children, onSubmit }) {
	const handleSubmit = (e) => {
		e.preventDefault();
		if (onSubmit) {
			onSubmit(e);
		}
	};

	return (
		<form onSubmit={handleSubmit} name={name}>
			{children}
			<button type="submit">Submit</button>
		</form>
	);
}
