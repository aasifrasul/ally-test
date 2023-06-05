import React, { useState, useEffect } from 'react';

export const useWindowFocus = () => {
	const [focus, setFocus] = useState(() => document.hasFocus());
	const onFocus = () => setFocus(true);
	const onBlur = () => setFocus(false);

	useEffect(() => {
		window.addEventListener('focus', onFocus);
		window.addEventListener('blur', onBlur);

		return () => {
			window.removeEventListener('focus', onFocus);
			window.removeEventListener('blur', onBlur);
		};
	}, []);

	return focus;
};
