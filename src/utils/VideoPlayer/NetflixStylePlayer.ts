// Complete integration example
class NetflixStylePlayer {
	constructor(videoElement) {
		this.video = videoElement;
		this.msePlayer = new AdvancedMSEPlayer(videoElement);
		this.abrController = new ProductionABRController(this);
		this.qualityLevels = this.abrController.qualityLevels;

		this.initialize();
	}

	async initialize() {
		await this.msePlayer.initialize();
		this.setupEventHandlers();
		this.loadInitialManifest();
	}

	async switchToQuality(quality) {
		console.log(`Switching to ${quality.label}`);

		// In real implementation, this would:
		// 1. Parse new manifest/playlist
		// 2. Calculate seamless switch point
		// 3. Load new quality segments
		// 4. Coordinate MSE buffer management

		// Simulate the switch
		this.currentQuality = quality;
		this.onQualitySwitch(quality);
	}

	getBufferLength() {
		return this.msePlayer.getBufferLength();
	}

	setupEventHandlers() {
		// Forward important events to ABR controller
		this.video.addEventListener('loadedmetadata', () => {
			this.onMetadataLoaded();
		});

		this.video.addEventListener('error', (e) => {
			this.handleVideoError(e);
		});
	}

	onQualitySwitch(quality) {
		// Update UI, analytics, etc.
		this.dispatchEvent(
			new CustomEvent('qualitychange', {
				detail: quality,
			}),
		);
	}
}
