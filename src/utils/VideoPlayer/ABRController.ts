// Adaptive Bitrate Streaming Implementation
class ABRController {
	private player: any; // Assuming 'player' has methods like getBufferLength(), switchSource(), and provides video element access
	private qualityLevels: { height: number; bitrate: number; label: string; url?: string }[];
	private currentQualityIndex: number;
	private bandwidthHistory: number[]; // Stores bandwidth measurements in bps
	private bufferHealthHistory: { length: number; timestamp: number }[]; // Stores buffer length over time
	private monitoringIntervalId: any;
	private readonly MONITOR_INTERVAL_MS = 3000; // Check every 3 seconds (more frequent for faster adaptation)
	private readonly BANDWIDTH_HISTORY_SIZE = 15; // Keep last 15 measurements for a better average
	private readonly BUFFER_TARGET_SECONDS = 15; // Aim for 15 seconds of buffer
	private readonly BUFFER_LOW_THRESHOLD_SECONDS = 5; // Start considering downgrade below 5 seconds
	private readonly BUFFER_CRITICAL_THRESHOLD_SECONDS = 2; // Aggressive downgrade below 2 seconds
	private readonly SAFETY_FACTOR = 0.85; // Use 85% of available bandwidth for selection
	private readonly RTT_SMOOTHING_FACTOR = 0.1; // For potential Round-Trip Time (RTT) smoothing

	constructor(player: any) {
		if (!player) {
			console.error('ABRController: Player instance is required.');
			return;
		}
		this.player = player;
		this.qualityLevels = [
			{ height: 240, bitrate: 400000, label: '240p', url: 'video_240p.mp4' }, // Example URLs
			{ height: 480, bitrate: 1000000, label: '480p', url: 'video_480p.mp4' },
			{ height: 720, bitrate: 2500000, label: '720p', url: 'video_720p.mp4' },
			{ height: 1080, bitrate: 5000000, label: '1080p', url: 'video_1080p.mp4' },
		];
		this.currentQualityIndex = this.getInitialQualityIndex(); // Determine initial quality dynamically
		this.bandwidthHistory = [];
		this.bufferHealthHistory = [];
		this.monitoringIntervalId = null; // To store the interval ID for clearing
		this.startMonitoring();

		// Initial quality switch
		this.switchQuality(this.currentQualityIndex);
	}

	/**
	 * Determines an initial quality level based on a reasonable default or
	 * potentially user preferences/device capabilities (if available).
	 */
	private getInitialQualityIndex(): number {
		// A more sophisticated approach might involve a quick bandwidth test
		// or starting with a middle-ground quality like 480p or 720p.
		// For now, let's start with a mid-range quality.
		return Math.floor(this.qualityLevels.length / 2);
	}

	/**
	 * Starts the periodic monitoring process.
	 */
	public startMonitoring(): void {
		if (this.monitoringIntervalId) {
			console.warn('ABRController: Monitoring is already active.');
			return;
		}
		this.monitoringIntervalId = setInterval(() => {
			this.measureBandwidth();
			this.checkBufferHealth(); // Update buffer history
			this.adjustQuality();
			this.updateDisplay(); // Update UI more frequently
		}, this.MONITOR_INTERVAL_MS);
		console.log(
			`ABRController: Monitoring started, checking every ${this.MONITOR_INTERVAL_MS / 1000} seconds.`,
		);
	}

	/**
	 * Stops the periodic monitoring process.
	 */
	public stopMonitoring(): void {
		if (this.monitoringIntervalId) {
			clearInterval(this.monitoringIntervalId);
			this.monitoringIntervalId = null;
			console.log('ABRController: Monitoring stopped.');
		}
	}

	/**
	 * Measures current bandwidth by fetching a small test file.
	 * Includes error handling and keeps a history of measurements.
	 */
	private async measureBandwidth(): Promise<void> {
		const startTime = Date.now();
		// Use a small, cache-busted image for measurement.
		// In a production scenario, you might use a dedicated bandwidth test file provided by your CDN.
		const testUrl = 'https://via.placeholder.com/100x100.jpg?v=' + Math.random();

		try {
			const response = await fetch(testUrl, { cache: 'no-store' }); // Prevent caching
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const data = await response.blob();
			const endTime = Date.now();

			const duration = (endTime - startTime) / 1000; // seconds
			if (duration === 0) {
				// Prevent division by zero
				console.warn('Bandwidth measurement duration was zero, skipping.');
				return;
			}
			const bits = data.size * 8;
			const bandwidth = bits / duration; // bits per second

			this.bandwidthHistory.push(bandwidth);
			if (this.bandwidthHistory.length > this.BANDWIDTH_HISTORY_SIZE) {
				this.bandwidthHistory.shift(); // Keep only the most recent measurements
			}
			// console.log(`Bandwidth measured: ${(bandwidth / 1000000).toFixed(2)} Mbps`);
		} catch (error) {
			console.warn(
				'Bandwidth measurement failed:',
				error instanceof Error ? error.message : error,
			);
		}
	}

	/**
	 * Calculates the average bandwidth from the history.
	 * Uses a weighted average or median for more stability against spikes/drops.
	 */
	private getAverageBandwidth(): number {
		if (this.bandwidthHistory.length === 0) {
			// If no history, default to a reasonable mid-range bitrate
			return this.qualityLevels[this.getInitialQualityIndex()].bitrate;
		}

		// Using a simple average for now, but a more robust approach:
		// 1. Sort the history and take the median.
		// 2. Apply an exponential moving average (EMA) or weighted average.
		const sum = this.bandwidthHistory.reduce((a, b) => a + b, 0);
		return sum / this.bandwidthHistory.length;
	}

	/**
	 * Gathers buffer health metrics.
	 * Tracks buffer length over time to detect trends (e.g., buffer depletion rate).
	 */
	private checkBufferHealth(): {
		length: number;
		trend: 'growing' | 'stable' | 'shrinking';
		isBuffering: boolean;
	} {
		const bufferLength = this.player.getBufferLength(); // Assumed method on player
		const isBuffering = this.player.video.readyState < 3; // HTMLMediaElement.HAVE_FUTURE_DATA

		const now = Date.now();
		this.bufferHealthHistory.push({ length: bufferLength, timestamp: now });

		// Keep buffer history manageable (e.g., last few samples within a minute)
		const ONE_MINUTE_MS = 60 * 1000;
		this.bufferHealthHistory = this.bufferHealthHistory.filter(
			(entry) => now - entry.timestamp < ONE_MINUTE_MS,
		);

		let bufferTrend: 'growing' | 'stable' | 'shrinking' = 'stable';
		if (this.bufferHealthHistory.length >= 2) {
			const latest = this.bufferHealthHistory[this.bufferHealthHistory.length - 1];
			const previous = this.bufferHealthHistory[this.bufferHealthHistory.length - 2];
			if (latest.length > previous.length + 0.5) {
				// Check for significant change
				bufferTrend = 'growing';
			} else if (latest.length < previous.length - 0.5) {
				bufferTrend = 'shrinking';
			}
		}

		return {
			length: bufferLength,
			trend: bufferTrend,
			isBuffering: isBuffering,
		};
	}

	/**
	 * Adjusts video quality based on measured bandwidth and buffer health.
	 * Implements a more sophisticated decision-making logic.
	 */
	private adjustQuality(): void {
		const avgBandwidth = this.getAverageBandwidth();
		const bufferStatus = this.checkBufferHealth(); // Get fresh status

		// Use a safety factor to prevent overshooting
		const usableBandwidth = avgBandwidth * this.SAFETY_FACTOR;

		let targetQualityIndex = this.currentQualityIndex;
		let reasons: string[] = [];

		// --- Quality Downgrade Logic ---
		if (
			bufferStatus.isBuffering ||
			bufferStatus.length < this.BUFFER_CRITICAL_THRESHOLD_SECONDS
		) {
			// Critical buffer or actively buffering: aggressive downgrade
			targetQualityIndex = Math.max(0, this.currentQualityIndex - 2);
			reasons.push(`Critical buffer (${bufferStatus.length.toFixed(1)}s) or buffering`);
		} else if (bufferStatus.length < this.BUFFER_LOW_THRESHOLD_SECONDS) {
			// Low buffer: conservative downgrade
			targetQualityIndex = Math.max(0, this.currentQualityIndex - 1);
			reasons.push(`Low buffer (${bufferStatus.length.toFixed(1)}s)`);
		}

		// --- Quality Upgrade Logic ---
		// Only consider upgrade if buffer is healthy and not shrinking
		if (
			bufferStatus.length >= this.BUFFER_TARGET_SECONDS &&
			bufferStatus.trend !== 'shrinking'
		) {
			let potentialUpgradeIndex = this.currentQualityIndex;
			for (let i = this.qualityLevels.length - 1; i >= 0; i--) {
				// Iterate from highest to lowest
				if (this.qualityLevels[i].bitrate <= usableBandwidth) {
					potentialUpgradeIndex = i;
					break; // Found the highest quality that fits
				}
			}

			// Only upgrade if the potential quality is higher than current
			if (potentialUpgradeIndex > this.currentQualityIndex) {
				targetQualityIndex = potentialUpgradeIndex;
				reasons.push(
					`Buffer healthy (${bufferStatus.length.toFixed(1)}s) and bandwidth (${(usableBandwidth / 1000000).toFixed(1)} Mbps) allows upgrade`,
				);
			}
		}

		// Ensure we don't go below 0 or above max index
		targetQualityIndex = Math.max(
			0,
			Math.min(targetQualityIndex, this.qualityLevels.length - 1),
		);

		if (targetQualityIndex !== this.currentQualityIndex) {
			this.switchQuality(targetQualityIndex, reasons.join(', '));
		} else {
			// console.log(`No quality change needed. Current: ${this.qualityLevels[this.currentQualityIndex].label}, Buffer: ${bufferStatus.length.toFixed(1)}s, BW: ${(avgBandwidth / 1000000).toFixed(1)} Mbps`);
		}
	}

	/**
	 * Initiates the quality switch.
	 * In a real player, this would involve loading a new video segment or re-initializing the MediaSource.
	 */
	private switchQuality(
		newQualityIndex: number,
		reason: string = 'Automatic adjustment',
	): void {
		if (newQualityIndex < 0 || newQualityIndex >= this.qualityLevels.length) {
			console.error(`Invalid quality index: ${newQualityIndex}`);
			return;
		}

		const oldQuality = this.qualityLevels[this.currentQualityIndex];
		const newQuality = this.qualityLevels[newQualityIndex];

		// Avoid unnecessary switches if already at target quality
		if (this.currentQualityIndex === newQualityIndex) {
			// console.log(`Already at target quality: ${newQuality.label}`);
			return;
		}

		console.log(
			`Quality switch: ${oldQuality.label} → ${newQuality.label}. Reason: ${reason}`,
		);

		this.currentQualityIndex = newQualityIndex;

		// --- Real Implementation Detail ---
		// This is where you would integrate with your actual video player's API.
		// For a DASH/HLS player, this usually means setting a new rendition/quality level.
		// For simpler players, it might involve changing the source URL and reloading.
		if (this.player && typeof this.player.switchSource === 'function' && newQuality.url) {
			// Example: Assumes player has a method to switch source URL
			// This is a simplistic example for demonstration. Real ABR involves
			// MediaSource Extensions (MSE) to seamlessly switch segments.
			// this.player.switchSource(newQuality.url);
			console.log(`Player instructed to switch to: ${newQuality.url}`);
		} else {
			console.warn(
				"ABRController: Player does not have a 'switchSource' method or URL is missing.",
			);
		}

		this.updateDisplay();
	}

	/**
	 * Updates the UI elements to reflect current ABR status.
	 * Ensure these elements exist in your HTML.
	 */
	private updateDisplay(): void {
		const currentQuality = this.qualityLevels[this.currentQualityIndex];
		const avgBandwidth = this.getAverageBandwidth();
		const bufferHealth = this.checkBufferHealth(); // Get fresh buffer data for display

		const currentQualityElement = document.getElementById('currentQuality');
		const bandwidthElement = document.getElementById('bandwidth');
		const bufferHealthElement = document.getElementById('bufferHealth');
		const bufferLengthElement = document.getElementById('bufferLength'); // New element

		if (currentQualityElement) {
			currentQualityElement.textContent = `Auto (${currentQuality.label})`;
		}
		if (bandwidthElement) {
			bandwidthElement.textContent = `${(avgBandwidth / 1000000).toFixed(2)} Mbps`;
		}
		if (bufferHealthElement) {
			let healthText = 'Unknown';
			if (bufferHealth.isBuffering) {
				healthText = 'Buffering...';
			} else if (bufferHealth.length >= this.BUFFER_TARGET_SECONDS) {
				healthText = 'Good';
			} else if (bufferHealth.length >= this.BUFFER_LOW_THRESHOLD_SECONDS) {
				healthText = 'Fair (Low)';
			} else {
				healthText = 'Critical';
			}
			healthText += ` (${bufferHealth.trend})`; // Add trend
			bufferHealthElement.textContent = healthText;
		}
		if (bufferLengthElement) {
			bufferLengthElement.textContent = `${bufferHealth.length.toFixed(1)}s`;
		}
	}

	// --- Public API for manual control or debugging ---
	public getCurrentQuality(): { height: number; bitrate: number; label: string } {
		return this.qualityLevels[this.currentQualityIndex];
	}

	public getAvailableQualityLevels(): { height: number; bitrate: number; label: string }[] {
		return [...this.qualityLevels];
	}

	public setQuality(index: number): void {
		if (index >= 0 && index < this.qualityLevels.length) {
			this.switchQuality(index, 'Manual selection');
			this.stopMonitoring(); // Optionally stop auto ABR when manual selection is made
			console.log('ABRController: Switched to manual quality. Auto ABR stopped.');
		} else {
			console.warn(`Invalid quality index provided: ${index}`);
		}
	}

	public enableAutoABR(): void {
		this.startMonitoring();
		console.log('ABRController: Auto ABR re-enabled.');
	}
}

// Example Player Mock (for testing purposes)
class MockVideoPlayer {
	private buffer: number = 5; // Initial buffer length in seconds
	public video: HTMLVideoElement; // Mock video element for readyState

	constructor() {
		// Create a mock video element
		this.video = document.createElement('video');
		// Simulate readyState. 0: HAVE_NOTHING, 1: HAVE_METADATA, 2: HAVE_CURRENT_DATA, 3: HAVE_FUTURE_DATA, 4: HAVE_ENOUGH_DATA
		this.video.readyState = 4; // Assume enough data initially

		// Simulate buffer changes
		setInterval(() => {
			if (this.video.readyState < 3) {
				// If buffering, fill buffer
				this.buffer = Math.min(this.buffer + 0.5, 30); // Max 30s buffer
				if (this.buffer >= 5) this.video.readyState = 4; // Exit buffering state
			} else {
				// If playing, deplete buffer
				this.buffer = Math.max(0, this.buffer - 0.5);
				if (this.buffer < 2) this.video.readyState = 2; // Simulate entering buffering state
			}
		}, 1000); // Update buffer every second
	}

	getBufferLength(): number {
		return this.buffer;
	}

	switchSource(url: string): void {
		console.log(`Mock Player: Switching video source to ${url}`);
		// In a real player, this would trigger loading and potentially reset buffer
		this.buffer = 1; // Simulate buffer reset on source switch
		this.video.readyState = 2; // Simulate buffering state
	}
}

// Example Usage in HTML:
// <div id="abr-status">
//     <p>Current Quality: <span id="currentQuality">N/A</span></p>
//     <p>Avg Bandwidth: <span id="bandwidth">N/A</span></p>
//     <p>Buffer Length: <span id="bufferLength">N/A</span></p>
//     <p>Buffer Health: <span id="bufferHealth">N/A</span></p>
// </div>
// <button onclick="abrController.setQuality(3)">Set 1080p</button>
// <button onclick="abrController.enableAutoABR()">Enable Auto ABR</button>

// document.addEventListener('DOMContentLoaded', () => {
//     const player = new MockVideoPlayer(); // Replace with your actual video player instance
//     (window as any).abrController = new ABRController(player);
// });
