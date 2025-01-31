import React, { useRef, useEffect } from 'react';

type Callback<T> = (dependencies: T) => void;

const useEffectOnlyOnUpdate = <T>(callback: Callback<T>, dependencies: T) => {
	const didMount = useRef<boolean>(false);

	useEffect(() => {
		if (didMount.current) {
			callback(dependencies);
		} else {
			didMount.current = true;
		}
	}, [callback, dependencies]);
};

export default useEffectOnlyOnUpdate;
