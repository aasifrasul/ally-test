import { IS_Item } from '../types/infiniteScroll';
import { Movie_Item } from '../types/movieList';

export interface Action {
	type: string;
	payload?: any;
}

export interface GenericAction extends Action {
	schema: string;
}

export enum Schema {
	INFINITE_SCROLL = 'infiniteScroll',
	MOVIE_LIST = 'movieList',
	NESTED_CATEGORIES = 'nestedCategories',
	WINE_CONNOISSUER = 'wineConnoisseur',
	SEARCH_FORM = 'searchForm',
}

export type APIDataTypes =
	| Movie_Item[]
	| IS_Item[]
	| Array<unknown>
	| Record<string, unknown>
	| undefined;

export interface InitialState {
	isLoading?: boolean;
	isError?: boolean;
	isUpdating?: boolean;
	data?: APIDataTypes;
	originalData?: APIDataTypes;
	pageData?: any[];
	headers?: any[];
	currentPage?: number | undefined;
	TOTAL_PAGES?: number;
}

export interface GenericState {
	[key: string]: InitialState;
}

export type QueryParamValue = number | string;

export interface QueryParams {
	page?: number;
	[key: string]: QueryParamValue | undefined;
}

export type ReducerFunction = (state: InitialState, action: Action) => InitialState;
export type GenericReducer = (state: GenericState, action: GenericAction) => GenericState;

export interface DataSource {
	TOTAL_PAGES?: number;
	BASE_URL: string;
	schema: Schema;
	queryParams?: QueryParams;
	timeout?: number;
	reducer?: ReducerFunction;
	headers?: { [key: string]: string };
	options?: any;
	PRODUCT_LIST?: string;
	ADD_ITEM_URL?: string;
	API_KEY?: string;
}

export type DataSources = {
	[key in Schema]: DataSource;
};

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
	routes?: string[];
	tictactoe?: {
		allPossibleWinningCombo: Array<string[]>;
		allowedOptions: string[];
	};
	newsFeed?: NewsFeed;
	FormMetaData?: FormMetaData;
};

export interface Store<T extends GenericState> {
	getState: (schema: Schema) => InitialState;
}

export interface StoreContextValue<T extends GenericState> {
	dispatch: React.Dispatch<GenericAction>;
	store: Store<T>;
}

export interface ServerToClientEvents {
	noArg: () => void;
	basicEmit: (a: number, b: string, c: Buffer) => void;
	withAck: (d: string, callback: (e: number) => void) => void;
}

export interface ClientToServerEvents {
	hello: () => void;
}

export interface InterServerEvents {
	ping: () => void;
}
