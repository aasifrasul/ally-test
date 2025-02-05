import { atom, useAtom } from 'jotai';

import { getCurrentUserGroup, getCurrentUserId } from '../auth';
import { hashString } from '../hashString';
import { FeatureFlag } from '../types';
import { CACHE_KEY } from './constants';

const featureFlagsAtom = atom<Record<string, FeatureFlag>>({});

export const useFeatureFlags = () => {
	const [flags, setFlags] = useAtom(featureFlagsAtom);

	const fetchFlags = async () => {
		try {
			const response = await fetch('/api/feature-flags');
			const data = await response.json();

			// Cache in memory
			setFlags(data);

			// Cache in localStorage with timestamp
			localStorage.setItem(
				CACHE_KEY,
				JSON.stringify({
					timestamp: Date.now(),
					data,
				}),
			);
		} catch (error) {
			console.error('Error fetching feature flags:', error);
		}
	};

	const isEnabled = (flagName: string): boolean => {
		const flag = flags[flagName];
		if (!flag) return false;

		// Apply rules if they exist
		if (flag.rules) {
			// User group check
			if (flag.rules.userGroups?.length) {
				const userGroup = getCurrentUserGroup(); // Implement based on your auth system
				if (!flag.rules.userGroups.includes(userGroup)) {
					return false;
				}
			}

			// Percentage rollout
			if (flag.rules.percentage !== undefined) {
				const userId = getCurrentUserId(); // Implement based on your auth system
				const hash = hashString(`${flagName}-${userId}`);
				if (hash % 100 > flag.rules.percentage) {
					return false;
				}
			}
		}

		return flag.enabled;
	};

	const getValue = (flagName: string): any => {
		return flags[flagName]?.value;
	};

	return { flags, fetchFlags, isEnabled, getValue, setFlags };
};
