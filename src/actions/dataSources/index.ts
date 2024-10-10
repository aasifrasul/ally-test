import { DataSource, QueryParams, GenericState, InitialState } from '../../constants/types';

import * as helpers from '../../utils/APIHelper';
import { useSelector } from '../../hooks/useSelector';
import { constants } from '../../constants';

interface NextPageHash {
	[key: string]: number;
}

interface FetchDataOptions {
	// Define the structure of options if known
	[key: string]: string;
}

const nextPageHash: NextPageHash = {};

export function fetchData(schema: string, options?: FetchDataOptions) {
	const {
		BASE_URL,
		queryParams,
		timeout,
		options: defaultOptions,
	} = constants.dataSources[schema] as DataSource;

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

export function getList(schema: keyof GenericState): InitialState {
	return useSelector((store: GenericState) => store[schema]);
}

export function addItem(schema: string, data: any, options?: FetchDataOptions) {
	const {
		ADD_ITEM_URL,
		timeout,
		options: defaultOptions,
	} = constants.dataSources[schema] as DataSource;
	return helpers.updateData(
		schema,
		data,
		ADD_ITEM_URL,
		null,
		options || defaultOptions,
		timeout,
	);
}
