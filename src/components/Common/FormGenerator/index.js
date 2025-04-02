import React from 'react';

import Form from '../Form';
import InputText from '../InputText';
import TextArea from '../TextArea';

export default function FormGenerator(props) {
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
						<InputText
							key={id}
							id={id}
							name={name}
							initialValue={initialValue}
							placeholder={placeholder}
							label={label}
							validate={props.validations[validate]}
						/>
					);
				case 'textarea':
					return (
						<TextArea
							key={id}
							name={name}
							initialValue={initialValue}
							rows={rows}
							cols={cols}
						/>
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
		<Form id={props.id} name={props.name} onSubmit={props.onSubmit} defaultSubmit={false}>
			{children}
		</Form>
	);
}
