import { useEffect, useRef } from 'react';

const useIsMounted = () => {
	const mounted = useRef(true);

	useEffect(() => {
		return () => {
			mounted.current = false;
		};
	}, []);

	return mounted.current;
};

export default useIsMounted;
