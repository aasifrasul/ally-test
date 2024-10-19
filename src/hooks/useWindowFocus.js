import { useState } from 'react';
import { useEventListener } from './useEventListener';

export const useWindowFocus = () => {
	const [focus, setFocus] = useState(() => document.hasFocus());
	const onFocus = () => setFocus(true);
	const onBlur = () => setFocus(false);

	useEventListener('focus', onFocus);
	useEventListener('blur', onBlur);

	return focus;
};
