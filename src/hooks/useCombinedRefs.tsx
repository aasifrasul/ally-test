import { useCallback, MutableRefObject, RefCallback } from 'react';
import { isFunction } from '../utils/typeChecking';

export function useCombinedRefs<T>(
	...refs: (MutableRefObject<T | null> | RefCallback<T> | null | undefined)[]
): RefCallback<T> {
	return useCallback((element: T | null) => {
		refs.forEach((ref) => {
			if (!ref) return;

			if (isFunction(ref)) {
				ref(element);
			} else {
				ref.current = element;
			}
		});
	}, refs);
}
