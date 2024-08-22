import { useEffect, useRef } from 'react';

const useIsMounted = () => {
	const mounted = useRef(false);

	useEffect(() => {
		mounted.current = true;

		return () => {
			mounted.current = false;
		};
	}, []);

	return () => mounted.current;
};

export default useIsMounted;
