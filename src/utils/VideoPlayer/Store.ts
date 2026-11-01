// @ts-nocheck
// Video player store (Zustand)
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type Video = {
	id: string;
	name?: string;
};

type VideoStoreState = {
	currentVideo: Video | null;
	isPlaying: boolean;
	currentTime: number;
	quality: string;
	volume: number;
	subtitles: { enabled: boolean; language: string };
	play: () => void;
	pause: () => void;
	setCurrentTime: (time: number) => void;
	switchQuality: (quality: string) => Promise<void>;
};

export const useVideoStore = create<VideoStoreState>()(
	subscribeWithSelector((set, get) => ({
		currentVideo: null,
		isPlaying: false,
		currentTime: 0,
		quality: 'auto',
		volume: 1,
		subtitles: { enabled: false, language: 'en' },

		play: () => set({ isPlaying: true }),
		pause: () => set({ isPlaying: false }),
		setCurrentTime: (time: number) => set({ currentTime: time }),
		switchQuality: async (quality: string) => {
			const { currentVideo } = get();
			set({ quality });

			await window.videoPlayer?.switchQuality(quality);

			window.analytics?.track('quality_changed', {
				video_id: currentVideo?.id,
				new_quality: quality,
			});
		},
	})),
);

const fetchRecommendations = async (
	_userId: string,
	_preferences: Record<string, unknown>,
) => {
	return [] as Array<Record<string, unknown>>;
};

const fetchWatchlist = async (_userId: string) => {
	return [] as Array<Record<string, unknown>>;
};

const addToWatchlist = async (_userId: string, _videoId: string) => {
	return true;
};

export const useRecommendations = (userId: string, preferences: Record<string, unknown>) => {
	return useQuery({
		queryKey: ['recommendations', userId, preferences],
		queryFn: () => fetchRecommendations(userId, preferences),
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
	});
};

export const useWatchlist = (userId: string) => {
	const queryClient = useQueryClient();

	const { data: watchlist } = useQuery({
		queryKey: ['watchlist', userId],
		queryFn: () => fetchWatchlist(userId),
	});

	const addToWatchlistMutation = useMutation({
		mutationFn: (videoId: string) => addToWatchlist(userId, videoId),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ['watchlist', userId] });
		},
	});

	return { watchlist, addToWatchlist: addToWatchlistMutation.mutate };
};
