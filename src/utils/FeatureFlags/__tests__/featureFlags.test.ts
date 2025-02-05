import { renderHook, act } from '@testing-library/react-hooks';
import { useFeatureFlags } from '../featureFlags';

import { CACHE_KEY } from '../constants';

describe('Feature Flags', () => {
	beforeEach(() => {
		localStorage.clear();
		jest.clearAllMocks();
	});

	it('should fetch and cache flags', async () => {
		const mockFlags = {
			new_feature: { enabled: true },
		};

		global.fetch = jest.fn().mockResolvedValue({
			json: () => Promise.resolve(mockFlags),
		});

		const { result } = renderHook(() => useFeatureFlags());

		await act(async () => {
			await result.current.fetchFlags();
		});

		expect(result.current.isEnabled('new_feature')).toBe(true);
		expect(localStorage.getItem(CACHE_KEY)).toBeTruthy();
	});

	it('should respect percentage rollouts', () => {
		const mockFlags = {
			gradual_feature: {
				enabled: true,
				rules: { percentage: 50 },
			},
		};

		// Test implementation depends on your hashing function
	});
});
