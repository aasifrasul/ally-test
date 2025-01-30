import React from 'react';

import Form from '../Form';
import { InputText } from '../InputText';
import TextArea from '../TextArea';

interface FormGeneratorProps {
	id: string;
	name: string;
	children: {
		id: string;
		type: string;
		name: string;
		value: string;
		initialValue: string;
		placeholder: string;
		label: string;
		validate: string;
		rows: number;
		cols: number;
	}[];
	validations: {
		[key: string]: (value: string) => any;
	};
	onSubmit: (e: React.FormEvent) => void;
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
						<>
							<InputText
								key={id}
								id={id}
								name={name}
								initialValue={initialValue}
								placeholder={placeholder}
								label={label}
								validate={(value) => props.validations[validate](value) || ''}
							/>
							<hr />
						</>
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
