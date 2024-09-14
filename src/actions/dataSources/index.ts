import * as helpers from '../../utils/APIHelper';
import useSelector from '../../hooks/useSelector';
import { constants } from '../../constants';

interface NextPageHash {
	[key: string]: number;
}

const nextPageHash: NextPageHash = {};

interface FetchDataOptions {
	// Define the structure of options if known
	[key: string]: string;
}

interface QueryParams {
	page?: number;
	[key: string]: any;
}

interface DataSourceConfig {
	BASE_URL: string;
	queryParams: QueryParams;
	timeout: number;
	options: FetchDataOptions;
	ADD_ITEM_URL: string;
}

export function fetchData(schema: string, options?: FetchDataOptions) {
	const {
		BASE_URL,
		queryParams,
		timeout,
		options: defaultOptions,
	} = constants.dataSources[schema] as DataSourceConfig;

	const updatedQueryParams: QueryParams = { ...queryParams };

	if (nextPageHash[schema]) {
		updatedQueryParams.page = nextPageHash[schema];
		delete nextPageHash[schema];
	}

	return helpers.fetchData(
		schema,
		BASE_URL,
		updatedQueryParams,
		options || defaultOptions,
		timeout,
	);
}

export function fetchNextPage(schema: string, nextPage: number, options?: FetchDataOptions) {
	nextPageHash[schema] = nextPage;
	return fetchData(schema, options);
}

interface ListData {
	isError: boolean;
	isLoading: boolean;
	data: any; // Replace 'any' with a more specific type if known
	currentPage: number;
	TOTAL_PAGES: number;
}

export function getList(schema: string): ListData {
	const { isError, isLoading, data, currentPage, TOTAL_PAGES } = useSelector(
		(store: any) => store[schema], // Replace 'any' with a more specific store type if known
	);
	return { isError, isLoading, data, currentPage, TOTAL_PAGES };
}

export function addItem(schema: string, data: any, options?: FetchDataOptions) {
	const {
		ADD_ITEM_URL,
		timeout,
		options: defaultOptions,
	} = constants.dataSources[schema] as DataSourceConfig;
	return helpers.updateData(
		schema,
		data,
		ADD_ITEM_URL,
		null,
		options || defaultOptions,
		timeout,
	);
}
