import { useFetchStore } from '../../Context/dataFetchContext';
import { GenericState } from '../../constants/types';

type SelectorCallback<T extends GenericState, R> = (state: T) => R;

export function useSelector<T extends GenericState, R>(
	selectorCallback: SelectorCallback<T, R>,
): R {
	const { store } = useFetchStore();
	return selectorCallback(store as unknown as T);
}
