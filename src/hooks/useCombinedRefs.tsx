import React, { useRef, useEffect, MutableRefObject, RefCallback } from 'react';
import { isFunction } from '../utils/typeChecking';

function useCombinedRefs<T>(
	...refs: (MutableRefObject<T> | RefCallback<T> | null)[]
): MutableRefObject<T | null> {
	const targetRef = useRef<T | null>(null);

	useEffect(() => {
		refs.forEach((ref) => {
			if (!ref) return;

			if (isFunction(ref)) {
				(ref as RefCallback<T>)(targetRef.current);
			} else {
				if (targetRef.current !== null) {
					(ref as MutableRefObject<T>).current = targetRef.current;
				}
			}
		});
	}, [refs]);

	return targetRef;
}

export default useCombinedRefs;
