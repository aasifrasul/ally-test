import { dataSources } from './dataSources';
import { createImmutable } from '../utils/immutable';
import { BASE_URL, WS_URL } from './base';

import { Constants } from './types';

const routes = [
	'AsyncArticles',
	'BookStore',
	'CurrencyStream',
	'DisplayUsers',
	'FlipTheCard',
	'GraphqlSubscription',
	'Home',
	'InfiniteScroll',
	'KeyBoardShortcutPage',
	'Login',
	'MovieList',
	'NestedCategories',
	'SearchForm',
	'TabsComponent',
	'TodoGroups',
	'Todos',
	'UsersGraphql',
	'WineConnoisseur',
];

export const constants = createImmutable<Constants>({
	common: {},
	dataSources,
	routes,
	BASE_URL,
	WS_URL,
	tictactoe: {
		allPossibleWinningCombo: [
			[`idx-r1-c1`, `idx-r1-c2`, `idx-r1-c3`],
			[`idx-r2-c1`, `idx-r2-c2`, `idx-r2-c3`],
			[`idx-r3-c1`, `idx-r3-c2`, `idx-r3-c3`],
			[`idx-r1-c1`, `idx-r2-c1`, `idx-r3-c1`],
			[`idx-r1-c2`, `idx-r2-c2`, `idx-r3-c2`],
			[`idx-r1-c3`, `idx-r2-c3`, `idx-r3-c3`],
			[`idx-r1-c1`, `idx-r2-c2`, `idx-r3-c3`],
			[`idx-r1-c3`, `idx-r2-c2`, `idx-r3-c1`],
		],
		allowedOptions: ['O', 'X'],
	},
	newsFeed: {
		BASE_URL: 'https://newsapi.org/v2/',
		API_KEY: 'd85ffa9e47de4423af6a356f3f48d0dc',
	},
	FormMetaData: {
		id: 'form1',
		name: 'form1',
		onSubmit: 'handleSubmit',
		children: [
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
				type: 'submit',
				id: 'submitButton',
				name: 'submitButton',
				value: 'Submit',
			},
		],
		validations: {
			numeric: /[0-9]*/,
			alphabets: /[a-zA-Z]*/,
			alphaNumeric: /[a-zA-Z0-9]*/,
			name: /^[\w'\-,.][^0-9_!¡?÷?¿/\\+:@#$%ˆ&*(){}|~<>;:[\]]{2,}$/,
			phone: /^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/,
			email: /^[a-zA-Z0-9.!#$%&'*+/:?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
		},
	},
});
