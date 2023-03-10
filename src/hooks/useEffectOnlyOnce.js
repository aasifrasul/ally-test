import React, { useRef, useEffect } from 'react';

import { isFunction } from '../../utils/typeChecking';

const useEffectOnlyOnce = (callback, dependencies, condition) => {
	const calledOnce = useRef(false);

	useEffect(() => {
		if (calledOnce.current) {
			return;
		}

		if (isFunction(condition) && condition(dependencies)) {
			isFunction(callback) && callback(dependencies);

			calledOnce.current = true;
		}
	}, [callback, condition, dependencies]);
};

export default useEffectOnlyOnce;
