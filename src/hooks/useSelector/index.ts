import { useFetchStore } from '../../Context/dataFetchContext';
import { StoreSchema } from '../../Context/types';

type Selector<T extends StoreSchema, R> = (state: T) => R;

export function useSelector<T extends StoreSchema, R>(selector: Selector<T, R>): R {
	const { store } = useFetchStore();
	return selector(store as unknown as T);
}
