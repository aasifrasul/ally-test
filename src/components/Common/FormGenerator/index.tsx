import React from 'react';

import Form from '../Form';
import { InputText } from '../InputText';
import TextArea from '../TextArea';
import Button from '../Button';
import Spacer from '../Spacer';
import { FieldType } from '../../../constants/types';

const emptyFunc = (): void => {};

export interface FormFieldConfig {
	type: FieldType;
	id: string;
	name: string;
	value?: string;
	initialValue?: string;
	placeholder?: string;
	label?: string;
	validate?: string;
	rows?: number;
	cols?: number;
}

export type Validations = Record<string, (value: string) => boolean>;

export interface FormGeneratorProps {
	id: string;
	name: string;
	fields: FormFieldConfig[];
	validations: Validations;
	onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	onValidationError?: (errors: Record<string, string>) => void;
}

const fieldMapping: Record<FieldType, React.FC<any>> = {
	text: InputText,
	textarea: TextArea,
	submit: (props: { value: string }) => <Button type="submit">{props.value}</Button>,
	Spacer: () => <Spacer size={16} />,
};

const renderField = (field: FormGeneratorProps['fields'][0], validations: Validations) => {
	const { id, type, validate, ...restProps } = field;
	const Component = fieldMapping[type];

	const validation = validate ? validations[validate] : emptyFunc;
	return <Component key={id} {...restProps} validate={validation} />;
};

export default function FormGenerator(props: FormGeneratorProps) {
	const fields = props.fields.map((field) => renderField(field, props.validations));

	return (
		<Form name={props.name} onSubmit={props.onSubmit} defaultSubmit={false}>
			{fields}
		</Form>
	);
}
