// Video player store (Zustand)
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export const useVideoStore = create(
	subscribeWithSelector((set, get) => ({
		// State
		currentVideo: null,
		isPlaying: false,
		currentTime: 0,
		quality: 'auto',
		volume: 1,
		subtitles: { enabled: false, language: 'en' },

		// Actions
		play: () => set({ isPlaying: true }),
		pause: () => set({ isPlaying: false }),
		setCurrentTime: (time) => set({ currentTime: time }),

		// Complex action with side effects
		switchQuality: async (quality) => {
			const { currentVideo } = get();
			set({ quality });

			// Trigger quality switch in video player
			await window.videoPlayer?.switchQuality(quality);

			// Analytics
			window.analytics?.track('quality_changed', {
				video_id: currentVideo?.id,
				new_quality: quality,
			});
		},
	})),
);

// Server state with React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useRecommendations = (userId, preferences) => {
	return useQuery({
		queryKey: ['recommendations', userId, preferences],
		queryFn: () => fetchRecommendations(userId, preferences),
		staleTime: 5 * 60 * 1000, // 5 minutes
		refetchOnWindowFocus: false,
	});
};

export const useWatchlist = (userId) => {
	const queryClient = useQueryClient();

	const { data: watchlist } = useQuery({
		queryKey: ['watchlist', userId],
		queryFn: () => fetchWatchlist(userId),
	});

	const addToWatchlistMutation = useMutation({
		mutationFn: (videoId) => addToWatchlist(userId, videoId),
		onSuccess: () => {
			// Optimistic update
			queryClient.invalidateQueries(['watchlist', userId]);
		},
	});

	return { watchlist, addToWatchlist: addToWatchlistMutation.mutate };
};
