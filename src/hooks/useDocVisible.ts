import { useState } from 'react';
import { useDocumentEventListener } from './EventListeners/useDocumentEventListener';
import { isUndefined } from '../utils/typeChecking';

export const useDocVisible = () => {
	const [visible, setVisible] = useState(
		!isUndefined(document) && document.visibilityState === 'visible',
	); // Default to false if no document

	const change = () => setVisible(document.visibilityState === 'visible');

	useDocumentEventListener('visibilitychange', change);

	return visible;
};
