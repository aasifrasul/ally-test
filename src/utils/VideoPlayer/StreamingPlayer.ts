//  Media Source Extensions Implementation
interface StreamingPlayerConfig {
	bufferLowThreshold?: number;
	bufferHighThreshold?: number;
	maxRetries?: number;
	retryDelay?: number;
	enableAdaptiveBitrate?: boolean;
	preloadSegments?: number;
	enableMetrics?: boolean;
	enableSubtitles?: boolean;
}

interface VideoQuality {
	width: number;
	height: number;
	bitrate: number;
	framerate?: number;
	codec: string;
	mimeCodec: string;
}

interface SegmentInfo {
	url: string;
	duration: number;
	quality: VideoQuality;
	startTime: number;
	endTime: number;
	size?: number;
}

interface PlaybackMetrics {
	bufferHealth: number;
	downloadSpeed: number;
	droppedFrames: number;
	averageBitrate: number;
	stallCount: number;
	totalStallTime: number;
	qualitySwitches: number;
}

interface SubtitleTrack {
	language: string;
	label: string;
	url: string;
	format: 'vtt' | 'srt';
}

class StreamingPlayer extends EventTarget {
	private video: HTMLVideoElement;
	private mediaSource: MediaSource | null;
	private sourceBuffer: SourceBuffer | null;
	private audioSourceBuffer: SourceBuffer | null;
	private textTrack: TextTrack | null;

	// Segment management
	private videoSegments: SegmentInfo[];
	private audioSegments: SegmentInfo[];
	private segmentQueue: SegmentInfo[];
	private currentSegmentIndex: number;
	private isAppending: boolean;

	// Quality and adaptation
	private qualities: VideoQuality[];
	private currentQuality!: VideoQuality;
	private enableAdaptiveBitrate: boolean;
	private qualityHistory: { quality: VideoQuality; timestamp: number }[];

	// Buffer management
	private readonly BUFFER_LOW_THRESHOLD: number;
	private readonly BUFFER_HIGH_THRESHOLD: number;
	private readonly MAX_BUFFER_SIZE: number;
	private bufferCheckInterval: NodeJS.Timeout | null;

	// Error handling and retry logic
	private readonly MAX_RETRIES: number;
	private readonly RETRY_DELAY: number;
	private segmentRetryCount: Map<string, number>;

	// Performance metrics
	private metrics: PlaybackMetrics;
	private enableMetrics: boolean;
	private lastMetricsUpdate: number;
	private downloadStartTime: number;

	// Subtitle support
	private subtitleTracks: SubtitleTrack[];
	private currentSubtitleTrack: SubtitleTrack | null;

	// Network monitoring
	private networkObserver: any | null;
	private estimatedBandwidth: number;
	private bandwidthSamples: number[];

	// Preloading
	private preloadSegments: number;
	private preloadedSegments: Set<string>;

	constructor(videoElement: HTMLVideoElement, config: StreamingPlayerConfig = {}) {
		super();

		this.video = videoElement;
		this.mediaSource = null;
		this.sourceBuffer = null;
		this.audioSourceBuffer = null;
		this.textTrack = null;

		// Initialize arrays
		this.videoSegments = [];
		this.audioSegments = [];
		this.segmentQueue = [];
		this.qualities = [];
		this.qualityHistory = [];
		this.subtitleTracks = [];
		this.preloadedSegments = new Set();
		this.bandwidthSamples = [];

		// Configuration
		this.BUFFER_LOW_THRESHOLD = config.bufferLowThreshold ?? 30;
		this.BUFFER_HIGH_THRESHOLD = config.bufferHighThreshold ?? 60;
		this.MAX_BUFFER_SIZE = 120; // 2 minutes max
		this.MAX_RETRIES = config.maxRetries ?? 3;
		this.RETRY_DELAY = config.retryDelay ?? 1000;
		this.enableAdaptiveBitrate = config.enableAdaptiveBitrate ?? true;
		this.enableMetrics = config.enableMetrics ?? true;
		this.preloadSegments = config.preloadSegments ?? 3;

		// Initialize state
		this.currentSegmentIndex = 0;
		this.isAppending = false;
		this.segmentRetryCount = new Map();
		this.bufferCheckInterval = null;
		this.networkObserver = null;
		this.estimatedBandwidth = 1000000; // 1 Mbps default
		this.lastMetricsUpdate = Date.now();
		this.downloadStartTime = 0;
		this.currentSubtitleTrack = null;

		// Initialize metrics
		this.metrics = {
			bufferHealth: 0,
			downloadSpeed: 0,
			droppedFrames: 0,
			averageBitrate: 0,
			stallCount: 0,
			totalStallTime: 0,
			qualitySwitches: 0,
		};

		// Bind event handlers
		this.bindEventHandlers();

		// Initialize network monitoring
		this.initializeNetworkMonitoring();
	}

	private bindEventHandlers(): void {
		// MediaSource events
		this.onSourceOpen = this.onSourceOpen.bind(this);
		this.onSourceEnded = this.onSourceEnded.bind(this);
		this.onSourceClose = this.onSourceClose.bind(this);
		this.onMediaSourceError = this.onMediaSourceError.bind(this);

		// SourceBuffer events
		this.onSourceBufferUpdateEnd = this.onSourceBufferUpdateEnd.bind(this);
		this.onSourceBufferError = this.onSourceBufferError.bind(this);

		// Video events
		this.onVideoTimeUpdate = this.onVideoTimeUpdate.bind(this);
		this.onVideoWaiting = this.onVideoWaiting.bind(this);
		this.onVideoCanPlay = this.onVideoCanPlay.bind(this);
		this.onVideoStalled = this.onVideoStalled.bind(this);
		this.onVideoProgress = this.onVideoProgress.bind(this);
	}

	/**
	 * Initialize MSE with multiple source buffers for video and audio
	 */
	public async initializeMSE(videoCodec?: string, audioCodec?: string): Promise<void> {
		const defaultVideoCodec = videoCodec ?? 'video/mp4; codecs="avc1.42E01E"';
		const defaultAudioCodec = audioCodec ?? 'audio/mp4; codecs="mp4a.40.2"';

		// Check codec support
		if (!MediaSource.isTypeSupported(defaultVideoCodec)) {
			throw new Error(`Video codec not supported: ${defaultVideoCodec}`);
		}

		if (audioCodec && !MediaSource.isTypeSupported(defaultAudioCodec)) {
			throw new Error(`Audio codec not supported: ${defaultAudioCodec}`);
		}

		this.mediaSource = new MediaSource();
		this.setupMediaSourceEvents();
		this.video.src = URL.createObjectURL(this.mediaSource);
		this.setupVideoEvents();

		console.log(' MSE initialization started');
		this.dispatchEvent(new CustomEvent('mseInitialized'));
	}

	private setupMediaSourceEvents(): void {
		if (!this.mediaSource) return;

		this.mediaSource.addEventListener('sourceopen', this.onSourceOpen);
		this.mediaSource.addEventListener('sourceended', this.onSourceEnded);
		this.mediaSource.addEventListener('sourceclose', this.onSourceClose);
		this.mediaSource.addEventListener('error', this.onMediaSourceError);
	}

	private setupVideoEvents(): void {
		this.video.addEventListener('timeupdate', this.onVideoTimeUpdate);
		this.video.addEventListener('waiting', this.onVideoWaiting);
		this.video.addEventListener('canplay', this.onVideoCanPlay);
		this.video.addEventListener('stalled', this.onVideoStalled);
		this.video.addEventListener('progress', this.onVideoProgress);
	}

	private async onSourceOpen(): Promise<void> {
		if (!this.mediaSource) return;

		try {
			// Create video source buffer
			this.sourceBuffer = this.mediaSource.addSourceBuffer(
				this.currentQuality?.mimeCodec ?? 'video/mp4; codecs="avc1.42E01E"',
			);
			this.sourceBuffer.addEventListener('updateend', this.onSourceBufferUpdateEnd);
			this.sourceBuffer.addEventListener('error', this.onSourceBufferError);

			// Create audio source buffer if needed
			if (this.audioSegments.length > 0) {
				this.audioSourceBuffer = this.mediaSource.addSourceBuffer(
					'audio/mp4; codecs="mp4a.40.2"',
				);
			}

			console.log('Source buffers created');
			this.startBufferManagement();
			this.dispatchEvent(new CustomEvent('sourceBuffersReady'));
		} catch (error) {
			console.error('Error creating source buffers:', error);
			if (this.mediaSource.readyState === 'open') {
				this.mediaSource.endOfStream('decode');
			}
		}
	}

	/**
	 * Set video segments with quality information
	 */
	public setVideoSegments(segments: SegmentInfo[], qualities: VideoQuality[]): void {
		this.videoSegments = segments;
		this.qualities = qualities;

		// Set initial quality (highest by default, or adaptive selection)
		if (this.enableAdaptiveBitrate && qualities.length > 0) {
			this.currentQuality = this.selectOptimalQuality();
		} else {
			this.currentQuality = qualities[qualities.length - 1] || qualities[0];
		}

		this.dispatchEvent(
			new CustomEvent('segmentsLoaded', {
				detail: { videoSegments: segments.length, qualities: qualities.length },
			}),
		);
	}

	/**
	 * Set audio segments
	 */
	public setAudioSegments(segments: SegmentInfo[]): void {
		this.audioSegments = segments;
	}

	/**
	 * Add subtitle tracks
	 */
	public addSubtitleTrack(track: SubtitleTrack): void {
		this.subtitleTracks.push(track);

		// Create text track in video element
		const textTrack = this.video.addTextTrack('subtitles', track.label, track.language);
		textTrack.mode = 'hidden';

		this.dispatchEvent(new CustomEvent('subtitleTrackAdded', { detail: track }));
	}

	/**
	 * Enable subtitle track
	 */
	public async enableSubtitleTrack(language: string): Promise<void> {
		const track = this.subtitleTracks.find((t) => t.language === language);
		if (!track) return;

		this.currentSubtitleTrack = track;

		// Load and parse subtitle file
		try {
			const response = await fetch(track.url);
			const subtitleText = await response.text();

			// Find corresponding text track
			for (let i = 0; i < this.video.textTracks.length; i++) {
				const textTrack = this.video.textTracks[i];
				if (textTrack.language === language) {
					textTrack.mode = 'showing';
					this.parseAndAddCues(textTrack, subtitleText, track.format);
					break;
				}
			}
		} catch (error) {
			console.error('Error loading subtitle track:', error);
		}
	}

	private parseAndAddCues(
		textTrack: TextTrack,
		content: string,
		format: 'vtt' | 'srt',
	): void {
		// Basic VTT/SRT parser - you might want to use a more robust library
		const lines = content.split('\n');
		let currentCue: { start: string; end: string; text: string[] } | null = null;

		for (const line of lines) {
			if (line.includes('-->')) {
				if (currentCue) {
					// Add previous cue
					const [start, end] = currentCue.start.includes(',')
						? [
								this.parseTimecodeSRT(currentCue.start),
								this.parseTimecodeSRT(currentCue.end),
							]
						: [
								this.parseTimecodeVTT(currentCue.start),
								this.parseTimecodeVTT(currentCue.end),
							];

					const cue = new VTTCue(start, end, currentCue.text.join('\n'));
					textTrack.addCue(cue);
				}

				const [start, end] = line.split('-->');
				currentCue = { start: start.trim(), end: end.trim(), text: [] };
			} else if (currentCue && line.trim()) {
				currentCue.text.push(line.trim());
			}
		}
	}

	private parseTimecodeVTT(timecode: string): number {
		const parts = timecode.split(':');
		const seconds = parts.pop()?.split('.') || ['0', '0'];
		return (
			parseInt(parts[0]) * 3600 +
			parseInt(parts[1]) * 60 +
			parseInt(seconds[0]) +
			parseInt(seconds[1]) / 1000
		);
	}

	private parseTimecodeSRT(timecode: string): number {
		const parts = timecode.split(':');
		const seconds = parts.pop()?.split(',') || ['0', '0'];
		return (
			parseInt(parts[0]) * 3600 +
			parseInt(parts[1]) * 60 +
			parseInt(seconds[0]) +
			parseInt(seconds[1]) / 1000
		);
	}

	/**
	 * Advanced buffer management with adaptive bitrate
	 */
	private startBufferManagement(): void {
		this.bufferCheckInterval = setInterval(() => {
			this.updateAndCheckBuffer();
			this.updateMetrics();

			if (this.enableAdaptiveBitrate) {
				this.adaptBitrate();
			}
		}, 1000);

		// Initial segment loading
		this.queueInitialSegments();
	}

	private queueInitialSegments(): void {
		const segmentsToQueue = Math.min(this.preloadSegments, this.videoSegments.length);

		for (let i = 0; i < segmentsToQueue; i++) {
			if (i < this.videoSegments.length) {
				this.queueSegment(this.videoSegments[i]);
			}
		}

		this.processSegmentQueue();
	}

	private queueSegment(segment: SegmentInfo): void {
		if (!this.segmentQueue.find((s) => s.url === segment.url)) {
			this.segmentQueue.push(segment);
		}
	}

	private async processSegmentQueue(): Promise<void> {
		if (
			!this.sourceBuffer ||
			this.isAppending ||
			this.segmentQueue.length === 0 ||
			this.sourceBuffer.updating
		) {
			return;
		}

		const segment = this.segmentQueue[0];

		try {
			this.isAppending = true;
			this.downloadStartTime = performance.now();

			const data = await this.fetchSegmentWithRetry(segment);

			if (
				this.sourceBuffer &&
				!this.sourceBuffer.updating &&
				this.mediaSource?.readyState === 'open'
			) {
				// Calculate download speed for metrics
				const downloadTime = performance.now() - this.downloadStartTime;
				const downloadSpeed = (data.byteLength * 8) / (downloadTime / 1000); // bits per second
				this.updateBandwidthEstimate(downloadSpeed);

				this.sourceBuffer.appendBuffer(data);
				this.segmentQueue.shift();

				this.dispatchEvent(
					new CustomEvent('segmentAppended', {
						detail: { segment, downloadSpeed },
					}),
				);
			}
		} catch (error) {
			console.error('Failed to process segment:', segment.url, error);
			this.isAppending = false;
			this.segmentQueue.shift(); // Remove failed segment
			this.handleSegmentError(segment, error);
		}
	}

	private async fetchSegmentWithRetry(segment: SegmentInfo): Promise<ArrayBuffer> {
		const retryCount = this.segmentRetryCount.get(segment.url) || 0;

		try {
			const response = await fetch(segment.url);
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			// Reset retry count on success
			this.segmentRetryCount.delete(segment.url);
			return await response.arrayBuffer();
		} catch (error) {
			if (retryCount < this.MAX_RETRIES) {
				this.segmentRetryCount.set(segment.url, retryCount + 1);
				console.warn(`Retrying segment ${segment.url}, attempt ${retryCount + 1}`);

				// Wait before retry
				await new Promise((resolve) =>
					setTimeout(resolve, this.RETRY_DELAY * (retryCount + 1)),
				);
				return this.fetchSegmentWithRetry(segment);
			}

			throw error;
		}
	}

	private handleSegmentError(segment: SegmentInfo, error: any): void {
		this.dispatchEvent(
			new CustomEvent('segmentError', {
				detail: { segment, error: error.message },
			}),
		);

		// Try alternative quality if available
		if (this.enableAdaptiveBitrate && this.qualities.length > 1) {
			const lowerQuality = this.selectLowerQuality();
			if (lowerQuality && lowerQuality !== this.currentQuality) {
				console.log('Switching to lower quality due to segment error');
				this.switchQuality(lowerQuality);
			}
		}
	}

	/**
	 * Adaptive bitrate logic
	 */
	private adaptBitrate(): void {
		if (!this.enableAdaptiveBitrate || this.qualities.length <= 1) return;

		const bufferHealth = this.getBufferLength();
		const optimalQuality = this.selectOptimalQuality();

		if (optimalQuality !== this.currentQuality) {
			console.log(
				`Quality change: ${this.currentQuality.height}p -> ${optimalQuality.height}p`,
			);
			this.switchQuality(optimalQuality);
		}
	}

	private selectOptimalQuality(): VideoQuality {
		const bufferHealth = this.getBufferLength();
		const availableBandwidth = this.estimatedBandwidth * 0.8; // Use 80% of estimated bandwidth

		// If buffer is low, prefer lower bitrate for stability
		if (bufferHealth < this.BUFFER_LOW_THRESHOLD / 2) {
			return this.selectQualityByBandwidth(availableBandwidth * 0.6);
		}

		// If buffer is healthy, we can try higher quality
		if (bufferHealth > this.BUFFER_HIGH_THRESHOLD) {
			return this.selectQualityByBandwidth(availableBandwidth * 1.2);
		}

		return this.selectQualityByBandwidth(availableBandwidth);
	}

	private selectQualityByBandwidth(bandwidth: number): VideoQuality {
		// Find the highest quality that fits within bandwidth
		const sortedQualities = [...this.qualities].sort((a, b) => a.bitrate - b.bitrate);

		for (let i = sortedQualities.length - 1; i >= 0; i--) {
			if (sortedQualities[i].bitrate <= bandwidth) {
				return sortedQualities[i];
			}
		}

		return sortedQualities[0]; // Return lowest quality if none fit
	}

	private selectLowerQuality(): VideoQuality | null {
		const currentIndex = this.qualities.findIndex((q) => q === this.currentQuality);
		return currentIndex > 0 ? this.qualities[currentIndex - 1] : null;
	}

	private switchQuality(newQuality: VideoQuality): void {
		if (newQuality === this.currentQuality) return;

		this.currentQuality = newQuality;
		this.metrics.qualitySwitches++;

		this.qualityHistory.push({
			quality: newQuality,
			timestamp: Date.now(),
		});

		this.dispatchEvent(
			new CustomEvent('qualityChanged', {
				detail: {
					newQuality,
					reason: 'adaptive',
					bufferHealth: this.getBufferLength(),
					bandwidth: this.estimatedBandwidth,
				},
			}),
		);
	}

	private updateBandwidthEstimate(speed: number): void {
		this.bandwidthSamples.push(speed);

		// Keep only recent samples (last 10)
		if (this.bandwidthSamples.length > 10) {
			this.bandwidthSamples.shift();
		}

		// Calculate moving average
		this.estimatedBandwidth =
			this.bandwidthSamples.reduce((sum, sample) => sum + sample, 0) /
			this.bandwidthSamples.length;
	}

	/**
	 *  buffer management
	 */
	private updateAndCheckBuffer(): void {
		const bufferLength = this.getBufferLength();
		const bufferEnd = this.getBufferedEnd();

		// Update metrics
		this.metrics.bufferHealth = bufferLength;

		// Clean old buffer data to prevent memory issues
		this.cleanOldBuffer();

		// Queue more segments if needed
		if (
			bufferLength < this.BUFFER_LOW_THRESHOLD &&
			this.currentSegmentIndex < this.videoSegments.length
		) {
			const segmentsToQueue = Math.min(
				Math.ceil((this.BUFFER_HIGH_THRESHOLD - bufferLength) / 10), // Assume 10s per segment
				this.videoSegments.length - this.currentSegmentIndex,
			);

			for (let i = 0; i < segmentsToQueue; i++) {
				if (this.currentSegmentIndex < this.videoSegments.length) {
					this.queueSegment(this.videoSegments[this.currentSegmentIndex]);
					this.currentSegmentIndex++;
				}
			}

			this.processSegmentQueue();
		}

		// End stream if all segments processed
		if (
			this.currentSegmentIndex >= this.videoSegments.length &&
			this.segmentQueue.length === 0 &&
			!this.isAppending &&
			this.mediaSource?.readyState === 'open'
		) {
			const buffered = this.video.buffered;
			if (
				buffered.length > 0 &&
				this.video.currentTime >= buffered.end(buffered.length - 1) - 1
			) {
				console.log('Ending stream - all segments processed');
				this.mediaSource.endOfStream();
			}
		}
	}

	private cleanOldBuffer(): void {
		if (!this.sourceBuffer || !this.video.buffered.length) return;

		const currentTime = this.video.currentTime;
		const bufferStart = this.video.buffered.start(0);

		// Remove buffer data that's more than 30 seconds behind current time
		if (currentTime - bufferStart > 30 && !this.sourceBuffer.updating) {
			try {
				const removeEnd = Math.min(currentTime - 20, bufferStart + 10);
				if (removeEnd > bufferStart) {
					this.sourceBuffer.remove(bufferStart, removeEnd);
				}
			} catch (error) {
				console.warn('Failed to remove old buffer:', error);
			}
		}
	}

	private getBufferedEnd(): number {
		const buffered = this.video.buffered;
		return buffered.length > 0 ? buffered.end(buffered.length - 1) : 0;
	}

	private getBufferLength(): number {
		if (!this.video.buffered.length) return 0;

		const currentTime = this.video.currentTime;
		const buffered = this.video.buffered;

		for (let i = 0; i < buffered.length; i++) {
			if (buffered.start(i) <= currentTime && buffered.end(i) >= currentTime) {
				return buffered.end(i) - currentTime;
			}
		}

		// If not in any buffer range, return 0
		return 0;
	}

	/**
	 * Performance metrics and monitoring
	 */
	private updateMetrics(): void {
		if (!this.enableMetrics) return;

		const now = Date.now();
		const timeDelta = now - this.lastMetricsUpdate;

		// Update dropped frames (if available)
		if ('getVideoPlaybackQuality' in this.video) {
			const quality = (this.video as any).getVideoPlaybackQuality();
			this.metrics.droppedFrames = quality.droppedVideoFrames;
		}

		// Update average bitrate
		if (this.currentQuality) {
			this.metrics.averageBitrate = this.currentQuality.bitrate;
		}

		this.lastMetricsUpdate = now;

		// Dispatch metrics event periodically
		if (timeDelta > 5000) {
			// Every 5 seconds
			this.dispatchEvent(
				new CustomEvent('metricsUpdate', {
					detail: { ...this.metrics, bandwidth: this.estimatedBandwidth },
				}),
			);
		}
	}

	/**
	 * Network monitoring initialization
	 */
	private initializeNetworkMonitoring(): void {
		// Use Network Information API if available
		if ('connection' in navigator) {
			const connection = (navigator as any).connection;

			const updateConnectionInfo = () => {
				if (connection.downlink) {
					// Convert Mbps to bps
					this.estimatedBandwidth = connection.downlink * 1000000;
				}
			};

			updateConnectionInfo();
			connection.addEventListener('change', updateConnectionInfo);
		}
	}

	/**
	 * Event handlers
	 */
	private onSourceBufferUpdateEnd(): void {
		this.isAppending = false;
		this.processSegmentQueue();
	}

	private onSourceBufferError(event: Event): void {
		console.error('SourceBuffer error:', event);
		this.dispatchEvent(new CustomEvent('sourceBufferError', { detail: event }));
	}

	private onVideoTimeUpdate(): void {
		// Handled by buffer check interval
	}

	private onVideoWaiting(): void {
		console.warn('Video buffering...');
		this.metrics.stallCount++;
		this.dispatchEvent(
			new CustomEvent('buffering', { detail: { bufferLength: this.getBufferLength() } }),
		);
	}

	private onVideoCanPlay(): void {
		console.log('Video ready to play');
		this.dispatchEvent(new CustomEvent('canPlay'));
	}

	private onVideoStalled(): void {
		console.warn('Video stalled');
		this.updateAndCheckBuffer();
	}

	private onVideoProgress(): void {
		// Track download progress if needed
	}

	private onSourceEnded(): void {
		console.log('MediaSource ended');
		this.dispatchEvent(new CustomEvent('streamEnded'));
	}

	private onSourceClose(): void {
		console.log('MediaSource closed');
		this.cleanup();
	}

	private onMediaSourceError(event: Event): void {
		console.error('MediaSource error:', event);
		this.dispatchEvent(new CustomEvent('mediaSourceError', { detail: event }));
	}

	/**
	 * Public API methods
	 */
	public getMetrics(): PlaybackMetrics & { bandwidth: number } {
		return { ...this.metrics, bandwidth: this.estimatedBandwidth };
	}

	public getCurrentQuality(): VideoQuality {
		return this.currentQuality;
	}

	public getAvailableQualities(): VideoQuality[] {
		return [...this.qualities];
	}

	public setQuality(quality: VideoQuality): void {
		if (this.qualities.includes(quality)) {
			this.switchQuality(quality);
			this.enableAdaptiveBitrate = false; // Disable auto-switching
		}
	}

	public enableAdaptiveQuality(enable: boolean): void {
		this.enableAdaptiveBitrate = enable;
	}

	public getSubtitleTracks(): SubtitleTrack[] {
		return [...this.subtitleTracks];
	}

	public disableSubtitles(): void {
		for (let i = 0; i < this.video.textTracks.length; i++) {
			this.video.textTracks[i].mode = 'hidden';
		}
		this.currentSubtitleTrack = null;
	}

	/**
	 * cleanup
	 */
	public cleanup(): void {
		console.log('Cleaning up  StreamingPlayer');

		// Clear intervals
		if (this.bufferCheckInterval) {
			clearInterval(this.bufferCheckInterval);
			this.bufferCheckInterval = null;
		}

		// Clean up MediaSource
		if (this.mediaSource) {
			this.mediaSource.removeEventListener('sourceopen', this.onSourceOpen);
			this.mediaSource.removeEventListener('sourceended', this.onSourceEnded);
			this.mediaSource.removeEventListener('sourceclose', this.onSourceClose);
			this.mediaSource.removeEventListener('error', this.onMediaSourceError);

			if (this.mediaSource.readyState === 'open') {
				try {
					this.mediaSource.endOfStream();
				} catch (e) {
					console.warn('Could not end stream during cleanup:', e);
				}
			}
		}

		// Clean up SourceBuffers
		if (this.sourceBuffer) {
			this.sourceBuffer.removeEventListener('updateend', this.onSourceBufferUpdateEnd);
			this.sourceBuffer.removeEventListener('error', this.onSourceBufferError);
		}

		if (this.audioSourceBuffer) {
			// Clean up audio source buffer events if any
		}

		// Clean up video events
		this.video.removeEventListener('timeupdate', this.onVideoTimeUpdate);
		this.video.removeEventListener('waiting', this.onVideoWaiting);
		this.video.removeEventListener('canplay', this.onVideoCanPlay);
		this.video.removeEventListener('stalled', this.onVideoStalled);
		this.video.removeEventListener('progress', this.onVideoProgress);

		// Revoke object URL
		if (this.video.src && this.video.src.startsWith('blob:')) {
			URL.revokeObjectURL(this.video.src);
			this.video.src = '';
		}

		// Clear all references
		this.mediaSource = null;
		this.sourceBuffer = null;
		this.audioSourceBuffer = null;
		this.textTrack = null;
		this.videoSegments = [];
		this.audioSegments = [];
		this.segmentQueue = [];
		this.qualities = [];
		this.qualityHistory = [];
		this.subtitleTracks = [];
		this.segmentRetryCount.clear();
		this.preloadedSegments.clear();
		this.bandwidthSamples = [];

		this.dispatchEvent(new CustomEvent('playerCleanedUp'));
	}
}

//  usage example with all features
/*
document.addEventListener('DOMContentLoaded', async () => {
	const videoElement = document.getElementById('myVideo') as HTMLVideoElement;

	// Define video qualities
	const qualities: VideoQuality[] = [
		{
			width: 1920,
			height: 1080,
			bitrate: 5000000,
			framerate: 30,
			codec: 'avc1.42E01E',
			mimeCodec: 'video/mp4; codecs="avc1.42E01E"'
		},
		{
			width: 1280,
			height: 720,
			bitrate: 2500000,
			framerate: 30,
			codec: 'avc1.42E01E',
			mimeCodec: 'video/mp4; codecs="avc1.42E01E"'
		},
		{
			width: 854,
			height: 480,
			bitrate: 1000000,
			framerate: 30,
			codec: 'avc1.42E01E',
			mimeCodec: 'video/mp4; codecs="avc1.42E01E"'
		}
	];

	// Define video segments with metadata
	const videoSegments: SegmentInfo[] = [
		{
			url: 'http://localhost:8000/1080p/init.mp4',
			duration: 0,
			quality: qualities[0],
			startTime: 0,
			endTime: 0,
			size: 1024
		},
		{
			url: 'http://localhost:8000/1080p/segment-1.m4s',
			duration: 10,
			quality: qualities[0],
			startTime: 0,
			endTime: 10,
			size: 1048576
		},
		// ... more segments
	];

	// Configure the enhanced streaming player
	const config: StreamingPlayerConfig = {
		bufferLowThreshold: 20,
		bufferHighThreshold: 40,
		maxRetries: 3,
		retryDelay: 1000,
		enableAdaptiveBitrate: true,
		preloadSegments: 5,
		enableMetrics: true,
		enableSubtitles: true
	};

	const player = new StreamingPlayer(videoElement, config);

	// Set up event listeners
	player.addEventListener('mseInitialized', () => {
		console.log('MSE initialized successfully');
	});

	player.addEventListener('qualityChanged', (event: CustomEvent) => {
		const { newQuality, reason, bufferHealth, bandwidth } = event.detail;
		console.log(`Quality changed to ${newQuality.height}p (${reason})`);
		console.log(`Buffer health: ${bufferHealth.toFixed(2)}s, Bandwidth: ${(bandwidth/1000000).toFixed(2)} Mbps`);
	});

	player.addEventListener('metricsUpdate', (event: CustomEvent) => {
		const metrics = event.detail;
		console.log('Performance metrics:', metrics);
		
		// Update UI with metrics
		updateMetricsDisplay(metrics);
	});

	player.addEventListener('buffering', (event: CustomEvent) => {
		const { bufferLength } = event.detail;
		console.log(`Buffering... Buffer length: ${bufferLength.toFixed(2)}s`);
		showBufferingIndicator(true);
	});

	player.addEventListener('canPlay', () => {
		showBufferingIndicator(false);
	});

	player.addEventListener('segmentError', (event: CustomEvent) => {
		const { segment, error } = event.detail;
		console.error(`Segment error for ${segment.url}: ${error}`);
	});

	try {
		// Initialize the enhanced streaming player
		await player.initializeMSE();
		
		// Set video segments and qualities
		player.setVideoSegments(videoSegments, qualities);
		
		// Add subtitle tracks
		player.addSubtitleTrack({
			language: 'en',
			label: 'English',
			url: 'http://localhost:8000/subtitles/english.vtt',
			format: 'vtt'
		});
		
		player.addSubtitleTrack({
			language: 'es',
			label: 'Español',
			url: 'http://localhost:8000/subtitles/spanish.vtt',
			format: 'vtt'
		});

		// Optional: Enable specific subtitle track
		await player.enableSubtitleTrack('en');

		console.log(' streaming player initialized successfully');
		
	} catch (error) {
		console.error('Failed to initialize streaming player:', error);
		showErrorMessage('Failed to initialize video player. Please check your browser compatibility.');
	}

	// UI helper functions
	function updateMetricsDisplay(metrics: any) {
		// Update your metrics dashboard
		document.getElementById('buffer-health')!.textContent = `${metrics.bufferHealth.toFixed(1)}s`;
		document.getElementById('download-speed')!.textContent = `${(metrics.bandwidth/1000000).toFixed(2)} Mbps`;
		document.getElementById('current-quality')!.textContent = `${player.getCurrentQuality().height}p`;
		document.getElementById('dropped-frames')!.textContent = metrics.droppedFrames.toString();
		document.getElementById('stall-count')!.textContent = metrics.stallCount.toString();
	}

	function showBufferingIndicator(show: boolean) {
		const indicator = document.getElementById('buffering-indicator');
		if (indicator) {
			indicator.style.display = show ? 'block' : 'none';
		}
	}

	function showErrorMessage(message: string) {
		const errorDiv = document.getElementById('error-message');
		if (errorDiv) {
			errorDiv.textContent = message;
			errorDiv.style.display = 'block';
		}
	}

	// Quality selector
	const qualitySelector = document.getElementById('quality-selector') as HTMLSelectElement;
	if (qualitySelector) {
		// Populate quality options
		const qualities = player.getAvailableQualities();
		qualities.forEach((quality, index) => {
			const option = document.createElement('option');
			option.value = index.toString();
			option.textContent = `${quality.height}p (${(quality.bitrate/1000000).toFixed(1)} Mbps)`;
			qualitySelector.appendChild(option);
		});

		// Add auto option
		const autoOption = document.createElement('option');
		autoOption.value = 'auto';
		autoOption.textContent = 'Auto';
		autoOption.selected = true;
		qualitySelector.insertBefore(autoOption, qualitySelector.firstChild);

		qualitySelector.addEventListener('change', (event) => {
			const target = event.target as HTMLSelectElement;
			if (target.value === 'auto') {
				player.enableAdaptiveQuality(true);
			} else {
				const qualityIndex = parseInt(target.value);
				const selectedQuality = qualities[qualityIndex];
				player.setQuality(selectedQuality);
			}
		});
	}

	// Subtitle selector
	const subtitleSelector = document.getElementById('subtitle-selector') as HTMLSelectElement;
	if (subtitleSelector) {
		const subtitleTracks = player.getSubtitleTracks();
		
		// Add "Off" option
		const offOption = document.createElement('option');
		offOption.value = 'off';
		offOption.textContent = 'Off';
		subtitleSelector.appendChild(offOption);

		subtitleTracks.forEach(track => {
			const option = document.createElement('option');
			option.value = track.language;
			option.textContent = track.label;
			subtitleSelector.appendChild(option);
		});

		subtitleSelector.addEventListener('change', async (event) => {
			const target = event.target as HTMLSelectElement;
			if (target.value === 'off') {
				player.disableSubtitles();
			} else {
				await player.enableSubtitleTrack(target.value);
			}
		});
	}

	// Cleanup on page unload
	window.addEventListener('beforeunload', () => {
		player.cleanup();
	});
});
*/

// Additional utility classes for advanced features

export {
	StreamingPlayer,
	type StreamingPlayerConfig,
	type VideoQuality,
	type SegmentInfo,
	type PlaybackMetrics,
	type SubtitleTrack,
};
// Example Usage:
// Assuming you have a video element in your HTML: <video id="myVideo" controls></video>

/*
document.addEventListener('DOMContentLoaded', () => {
	const videoElement = document.getElementById('myVideo') as HTMLVideoElement;

	// Replace with your actual segment URLs
	const videoSegments = [
		'http://localhost:8000/segment-init.mp4', // Initial segment (moov atom, etc.)
		'http://localhost:8000/segment-1.m4s',
		'http://localhost:8000/segment-2.m4s',
		'http://localhost:8000/segment-3.m4s',
		'http://localhost:8000/segment-4.m4s',
		'http://localhost:8000/segment-5.m4s',
		// ... more segments
	];

	const player = new StreamingPlayer(videoElement, videoSegments, 15, 45); // Low: 15s, High: 45s

	try {
		player.initializeMSE();
		// You might want to automatically play after initialization or allow user to click play
		// videoElement.play();
	} catch (error) {
		console.error('Failed to initialize StreamingPlayer:', error);
		// Display an error message to the user
	}

	// To clean up when no longer needed (e.g., when navigating away from the page)
	// window.addEventListener('beforeunload', () => {
	//     player.cleanup();
	// });
});
*/
