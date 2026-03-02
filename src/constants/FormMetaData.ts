import { FormMetaData } from './types';

export const FormData = {
	id: 'form1',
	name: 'form1',
	onSubmit: 'handleSubmit',
	fields: [
		{
			type: 'text',
			id: 'product_name',
			name: 'product_name',
			initialValue: '',
			placeholder: 'Only Alphabets allowed',
			label: 'Product Name',
			validate: 'alphabets',
		},
		{
			type: 'Spacer',
		},
		{
			type: 'text',
			id: 'original_price',
			name: 'original_price',
			initialValue: '',
			placeholder: 'Only Numbers allowed',
			label: 'Original Price',
			validate: 'numeric',
		},
		{
			type: 'text',
			id: 'sale_price',
			name: 'sale_price',
			initialValue: '',
			placeholder: 'Only Numbers allowed',
			label: 'Sale Price',
			validate: 'numeric',
		},
		{
			type: 'text',
			id: 'product_type',
			name: 'product_type',
			initialValue: '',
			placeholder: 'Only Numbers allowed',
			label: 'Product Type',
			validate: 'numeric',
		},
		{
			type: 'textarea',
			id: 'description',
			name: 'description',
			rows: 5,
			cols: 21,
			initialValue: '',
			label: 'Description',
		},
		{
			type: 'Spacer',
		},
		{
			type: 'submit',
			id: 'submitButton',
			name: 'submitButton',
			value: 'Submit',
		},
	],
	validations: {
		numeric: /^[0-9]+$/,
		alphabets: /^[a-zA-Z]+$/,
		alphaNumeric: /^[a-zA-Z0-9]+$/,
		name: /^[\w'\-,.][^0-9_!¡?÷?¿/\\+:@#$%ˆ&*(){}|~<>;:[\]]{2,}$/,
		phone: /^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/,
		email: /^[a-zA-Z0-9.!#$%&'*+/:?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
	},
} as FormMetaData;
