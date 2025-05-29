class AdvancedMSEPlayer {
	private video!: HTMLVideoElement;

	constructor(video: HTMLVideoElement) {
		this.video = video;
		this.mediaSource = new MediaSource();
		this.sourceBuffers = new Map(); // Support multiple tracks
		this.segmentQueue = [];
		this.bufferThresholds = {
			low: 10, // seconds
			target: 30, // seconds
			max: 60, // seconds
		};
	}

	async initialize() {
		// Check codec support
		const videoCodec = 'video/mp4; codecs="avc1.42E01E"';
		const audioCodec = 'audio/mp4; codecs="mp4a.40.2"';

		if (!MediaSource.isTypeSupported(videoCodec)) {
			throw new Error('Video codec not supported');
		}

		this.video.src = URL.createObjectURL(this.mediaSource);

		return new Promise((resolve) => {
			this.mediaSource.addEventListener('sourceopen', () => {
				this.setupSourceBuffers(videoCodec, audioCodec);
				resolve();
			});
		});
	}

	setupSourceBuffers(videoCodec, audioCodec) {
		// Create separate buffers for video and audio
		this.sourceBuffers.set('video', this.mediaSource.addSourceBuffer(videoCodec));
		this.sourceBuffers.set('audio', this.mediaSource.addSourceBuffer(audioCodec));

		// Setup buffer event listeners
		this.sourceBuffers.forEach((buffer, type) => {
			buffer.addEventListener('updateend', () => {
				this.onBufferUpdateEnd(type);
			});

			buffer.addEventListener('error', (e) => {
				console.error(`${type} buffer error:`, e);
			});
		});
	}

	async loadSegment(segmentInfo) {
		const { url, type, timestamp } = segmentInfo;

		try {
			const response = await fetch(url, {
				headers: {
					Range: `bytes=0-`, // Support byte-range requests
				},
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const data = await response.arrayBuffer();
			this.appendToBuffer(type, data, timestamp);
		} catch (error) {
			console.error('Segment load failed:', error);
			this.handleSegmentError(segmentInfo, error);
		}
	}

	appendToBuffer(type, data, timestamp) {
		const buffer = this.sourceBuffers.get(type);

		if (buffer && !buffer.updating) {
			// Remove old data if buffer is getting full
			this.manageBufferSize(buffer);

			buffer.timestampOffset = timestamp;
			buffer.appendBuffer(data);
		} else {
			// Queue for later if buffer is updating
			this.segmentQueue.push({ type, data, timestamp });
		}
	}

	manageBufferSize(buffer) {
		const currentTime = this.video.currentTime;
		const buffered = buffer.buffered;

		// Remove data older than 30 seconds behind current time
		for (let i = 0; i < buffered.length; i++) {
			const start = buffered.start(i);
			const end = buffered.end(i);

			if (end < currentTime - 30) {
				try {
					buffer.remove(start, end);
					console.log(`Removed buffer: ${start} - ${end}`);
				} catch (e) {
					console.warn('Buffer removal failed:', e);
				}
			}
		}
	}

	onBufferUpdateEnd(type) {
		// Process queued segments
		const queuedSegment = this.segmentQueue.find((s) => s.type === type);
		if (queuedSegment) {
			this.segmentQueue = this.segmentQueue.filter((s) => s !== queuedSegment);
			this.appendToBuffer(type, queuedSegment.data, queuedSegment.timestamp);
		}

		// Check if we need more data
		this.checkBufferHealth();
	}

	checkBufferHealth() {
		const bufferLength = this.getBufferLength();

		if (bufferLength < this.bufferThresholds.low) {
			console.log('Buffer running low, requesting more segments');
			this.onBufferLow();
		}
	}

	getBufferLength() {
		const buffered = this.video.buffered;
		const currentTime = this.video.currentTime;

		for (let i = 0; i < buffered.length; i++) {
			if (currentTime >= buffered.start(i) && currentTime <= buffered.end(i)) {
				return buffered.end(i) - currentTime;
			}
		}
		return 0;
	}
}
