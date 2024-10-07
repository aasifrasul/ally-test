export interface QueryParams {
	page?: number;
	[key: string]: number | string;
}

export interface DataSource {
	TOTAL_PAGES?: number;
	BASE_URL: string;
	schema: string;
	queryParams?: QueryParams;
	timeout?: number;
	reducer?: (state: any, action: any) => any;
	headers?: { [key: string]: string };
	options?: any;
	PRODUCT_LIST?: string;
	ADD_ITEM_URL?: string;
	API_KEY?: string;
}

export interface DataSources {
	[key: string]: DataSource;
}

export interface AutoCompleteConfig {
	initialFeed: string[];
	debounceDelay: number;
}

export interface Common {
	// Add any common properties here
}

export interface NewsFeed {
	BASE_URL: string;
	API_KEY: string;
}

export interface FormMetaData {
	id: string;
	name: string;
	onSubmit: string;
	children: Array<{
		type: 'text' | 'textarea' | 'submit';
		id: string;
		name: string;
		initialValue?: string;
		placeholder?: string;
		label?: string;
		validate?: string;
		rows?: number;
		cols?: number;
		value?: string;
	}>;
	validations: {
		numeric: RegExp;
		alphabets: RegExp;
		alphaNumeric: RegExp;
		name: RegExp;
		phone: RegExp;
		email: RegExp;
	};
}

export type Constants = {
	common?: Common;
	autoComplete?: AutoCompleteConfig;
	dataSources?: DataSources;
	tictactoe?: {
		allPossibleWinningCombo: Array<string[]>;
		allowedOptions: string[];
	};
	newsFeed?: NewsFeed;
	FormMetaData?: FormMetaData;
};
