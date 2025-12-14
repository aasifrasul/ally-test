import React from 'react';

import { safelyExecuteFunction } from '../../../utils/typeChecking';
import Button from '../Button';

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
		safelyExecuteFunction(onSubmit, null, e);
	};

	return (
		<form onSubmit={handleSubmit} name={name}>
			{children}
			{defaultSubmit ? <Button primary>Submit</Button> : null}
		</form>
	);
}
