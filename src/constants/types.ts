export interface QueryParams {
	[key: string]: number | string;
}

export interface DataSource {
	TOTAL_PAGES?: number;
	BASE_URL: string;
	schema: string;
	queryParams?: QueryParams;
	timeout: number;
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
