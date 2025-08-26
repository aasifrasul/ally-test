import { useEffect, useRef, EffectCallback } from 'react';

export const useEffectOnce = (effect: EffectCallback) => {
	const hasRun = useRef(false);

	useEffect(() => {
		if (hasRun.current) return;
		hasRun.current = true;
		return effect();
	}, []);
};
