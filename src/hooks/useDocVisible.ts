import { useState } from 'react';
import { useDocumentEventListener } from './EventListeners/useDocumentEventListener';

export const useDocVisible = () => {
	const [visible, setVisible] = useState(
		typeof document !== 'undefined' && document.visibilityState === 'visible',
	); // Default to false if no document

	const change = () => setVisible(document.visibilityState === 'visible');

	useDocumentEventListener('visibilitychange', change);

	return visible;
};
