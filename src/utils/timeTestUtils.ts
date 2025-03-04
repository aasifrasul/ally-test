let currentMockTime = 1000000;

export const setupTimeMocks = () => {
	const mockDateNow = jest.fn(() => currentMockTime);
	const originalDateNow = Date.now;

	// Replace Date.now
	Date.now = mockDateNow;

	// Mock RAF
	jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
		return setTimeout(() => cb(Date.now()), 16) as unknown as number;
	});

	// Return utilities
	return {
		advanceTimersByTime: (ms: number) => {
			currentMockTime += ms;
			jest.advanceTimersByTime(ms);
		},
		cleanup: () => {
			Date.now = originalDateNow;
			jest.restoreAllMocks();
		},
	};
};
