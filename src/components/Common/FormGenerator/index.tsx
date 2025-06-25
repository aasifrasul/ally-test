import React from 'react';

import Form from '../Form';
import { InputText } from '../InputText';
import TextArea from '../TextArea';

type InputType = 'text' | 'textarea' | 'submit';

export interface FormElements extends HTMLFormControlsCollection {
	item: (index: number) => HTMLInputElement | null;
	length: number;
}

export interface FormWithElements extends HTMLFormElement {
	elements: FormElements;
}

const emptyFunc = (): void => {};

interface FormGeneratorProps {
	id: string;
	name: string;
	children: {
		id: string;
		type: InputType;
		name: string;
		value?: string;
		initialValue?: string;
		placeholder?: string;
		label?: string;
		validate?: string;
		rows?: number;
		cols?: number;
	}[];
	validations: {
		[key: string]: (value: string) => any;
	};
	onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function FormGenerator(props: FormGeneratorProps) {
	const children = props?.children?.map(
		({
			id,
			type,
			name,
			value,
			initialValue,
			placeholder,
			label,
			validate,
			rows,
			cols,
		}) => {
			switch (type) {
				case 'text':
					return (
						<React.Fragment key={id}>
							{' '}
							<InputText
								id={id}
								name={name}
								initialValue={initialValue}
								placeholder={placeholder}
								label={label}
								validate={
									validate
										? props.validations[validate] || emptyFunc
										: emptyFunc
								}
							/>
							<hr />
						</React.Fragment>
					);
				case 'textarea':
					return (
						<>
							<TextArea id={id} name={name} rows={rows} cols={cols} />
							<hr />
						</>
					);
				case 'submit':
					return (
						<div>
							<button key={id} type={type}>
								{value}
							</button>
						</div>
					);
				default:
					return null;
			}
		},
	);

	return (
		<Form name={props.name} onSubmit={props.onSubmit} defaultSubmit={false}>
			{children}
		</Form>
	);
}
