import { useEffect, useRef } from 'react';

export const useEffectOnce = (effect: () => void | (() => void)) => {
	const hasRun = useRef(false);

	useEffect(() => {
		if (hasRun.current) return;
		hasRun.current = true;
		return effect();
	}, []);
};
