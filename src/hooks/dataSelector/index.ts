import { useFetchStore } from '../../Context/dataFetchContext';
import { GenericState, InitialState } from '../../constants/types';
import { Schema } from '../../constants/types';
import { useFetch } from '../useFetch';

type SelectorCallback<T extends GenericState, R> = (state: T) => R;

export function useSelector<T extends GenericState, R>(
	selectorCallback: SelectorCallback<T, R>,
): R {
	const { store } = useFetchStore();
	return selectorCallback(store as unknown as T);
}

export function getList(schema: Schema): InitialState {
	return useSelector((store) => store[schema]);
}

export function useSchemaQuery(schema: Schema) {
	const { fetchData, fetchNextPage, updateData } = useFetch(schema);
	const { data, pageData, headers, currentPage, isLoading, isError } = getList(schema);

	return {
		data,
		pageData,
		headers,
		isLoading,
		currentPage,
		isError,
		fetchData,
		fetchNextPage,
		updateData,
	};
}
