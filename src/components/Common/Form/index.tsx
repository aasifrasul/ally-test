import React from 'react';

import { safelyExecuteFunction } from '../../../utils/typeChecking';

interface FormProps {
	name?: string;
	children: React.ReactNode[] | React.ReactNode;
	onSubmit?: (e: HandleSubmitEvent) => void;
	defaultSubmit?: boolean;
}

interface HandleSubmitEvent extends React.FormEvent<HTMLFormElement> {}

export default function Form({ name, children, onSubmit, defaultSubmit }: FormProps) {
	const handleSubmit = (e: HandleSubmitEvent): void => {
		e.preventDefault();

		if (typeof onSubmit === 'function') {
			onSubmit(e as any);
		}
	};

	return (
		<form onSubmit={handleSubmit} name={name}>
			{children}
			{defaultSubmit ? <button type="submit">Submit</button> : null}
		</form>
	);
}
