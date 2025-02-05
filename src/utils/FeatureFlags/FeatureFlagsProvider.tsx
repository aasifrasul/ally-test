import { useEffect } from 'react';
import { useFeatureFlags } from './featureFlags';

import { CACHE_KEY, CACHE_TTL } from './constants';

import { ReactNode } from 'react';

export const FeatureFlagsProvider = ({ children }: { children: ReactNode }) => {
	const { fetchFlags, setFlags } = useFeatureFlags();

	useEffect(() => {
		// Check cache first
		const cached = localStorage.getItem(CACHE_KEY);
		if (cached) {
			const { timestamp, data } = JSON.parse(cached);
			if (Date.now() - timestamp < CACHE_TTL) {
				setFlags(data);
				return;
			}
		}

		// Set up WebSocket connection for real-time updates
		const ws = new WebSocket('ws://your-backend/feature-flags');
		ws.onmessage = (event) => {
			const flags = JSON.parse(event.data);
			setFlags(flags);
		};

		// Initial fetch
		fetchFlags();

		// Polling fallback
		const interval = setInterval(fetchFlags, CACHE_TTL);

		return () => {
			clearInterval(interval);
			ws.close();
		};
	}, []);

	return children;
};
