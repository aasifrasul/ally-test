import React, { useRef, useEffect } from 'react';

import { isFunction } from '../utils/typeChecking';

// first, define a helper for combining refs
function useCombinedRefs(...refs) {
	const targetRef = useRef();

	useEffect(() => {
		refs.forEach((ref) => {
			if (!ref) return;

			if (isFunction(ref)) {
				ref(targetRef.current);
			} else {
				ref.current = targetRef.current;
			}
		});
	}, [refs]);

	return targetRef;
}

export default useCombinedRefs;
