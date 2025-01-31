import { useState } from 'react';
import { useEventListener } from './EventListeners/useEventListener';

export const useWindowFocus = () => {
	const [focus, setFocus] = useState(() => document.hasFocus());
	const onFocus = () => setFocus(true);
	const onBlur = () => setFocus(false);

	useEventListener('focus', onFocus, window);
	useEventListener('blur', onBlur, window);

	return focus;
};
