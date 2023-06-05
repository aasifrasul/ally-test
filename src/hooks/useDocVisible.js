import React, { useState, useEffect } from 'react';

const useDocVisible = () => {
	const [visible, setVisible] = useState(document.visibilityState === 'visible');

	const change = () => setVisible(document.visibilityState === 'visible');

	useEffect(() => {
		document.addEventListener('visibilitychange', change);
		return () => document.removeEventListener('visibilitychange', change);
	}, []);

	return visible;
};

export default useDocVisible;
