import React, { useRef, useEffect } from 'react';

const useAsync = (asyncFn, onSuccess) => {
	const didMount = useRef(false);

	useEffect(() => {
		!didMount.current && (didMount.current = true);
		asyncFn().then((data) => didMount.current && onSuccess(data));
		return () => (didMount.current = false);
	}, [asyncFn, onSuccess]);
};

export default useAsync;
