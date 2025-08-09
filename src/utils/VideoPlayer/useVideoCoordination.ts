// Video-specific state coordination
import { useVideoStore } from './Store';

export const useVideoCoordination = () => {
	const videoState = useVideoStore();
	const { data: userProfile } = useUserProfile();
	const { mutate: updateWatchProgress } = useWatchProgressMutation();

	// Coordinate state changes
	useEffect(() => {
		const unsubscribe = useVideoStore.subscribe(
			(state) => state.currentTime,
			(currentTime, prevTime) => {
				// Auto-save progress every 30 seconds
				if (Math.floor(currentTime / 30) !== Math.floor(prevTime / 30)) {
					updateWatchProgress({
						videoId: videoState.currentVideo?.id,
						progress: currentTime,
						timestamp: Date.now(),
					});
				}
			},
		);

		return unsubscribe;
	}, []);
};
