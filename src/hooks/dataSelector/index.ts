import { useFetchStore } from '../../Context/dataFetchContext';
import { GenericState, InitialState } from '../../constants/types';
import { Schema } from '../../constants/types';
import { useFetch } from '../useFetch';

export function useSelector<T extends GenericState, R>(selector: (state: T) => R): R {
	const { state } = useFetchStore();
	return selector(state as T);
}

export function useSchema(schema: Schema): InitialState {
	return useSelector((state) => state[schema]);
}

export function useSchemaQuery(schema: Schema) {
	const { fetchData, fetchNextPage, updateData } = useFetch(schema);
	const { data, pageData, headers, currentPage, isLoading, isError } = useSchema(schema);

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
