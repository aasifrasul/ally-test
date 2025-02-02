import { useState } from 'react';
import { useWindowEventListener } from './EventListeners';

export const useWindowFocus = () => {
	const [focus, setFocus] = useState(() => document.hasFocus());
	const onFocus = () => setFocus(true);
	const onBlur = () => setFocus(false);

	useWindowEventListener('focus', onFocus);
	useWindowEventListener('blur', onBlur);

	return focus;
};
