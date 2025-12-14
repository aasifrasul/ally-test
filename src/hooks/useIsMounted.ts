import { useEffect, useRef } from 'react';

export const useIsMounted = (): (() => boolean) => {
	const mounted = useRef<boolean>(false);

	useEffect(() => {
		mounted.current = true;

		return () => {
			mounted.current = false;
		};
	}, []);

	return () => mounted.current;
};
