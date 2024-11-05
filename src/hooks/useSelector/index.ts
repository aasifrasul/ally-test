import { useFetchStore } from '../../Context/dataFetchContext';
import { GenericState } from '../../constants/types';

type Selector<T extends GenericState, R> = (state: T) => R;

export function useSelector<T extends GenericState, R>(selector: Selector<T, R>): R {
	const { store } = useFetchStore();
	return selector(store as unknown as T);
}
