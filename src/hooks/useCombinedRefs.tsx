import { useCallback, MutableRefObject, RefCallback } from 'react';

export function useCombinedRefs<T>(
	...refs: (MutableRefObject<T | null> | RefCallback<T> | null | undefined)[]
): RefCallback<T> {
	return useCallback((element: T | null) => {
		refs.forEach((ref) => {
			if (!ref) return;

			if (typeof ref === 'function') {
				ref(element);
			} else {
				ref.current = element;
			}
		});
	}, refs);
}
