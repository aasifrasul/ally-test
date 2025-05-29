class ProductionABRController {
	constructor(player) {
		this.player = player;
		this.qualityLevels = [
			{
				id: 'low',
				height: 240,
				bitrate: 400000,
				url: 'manifest_240p.m3u8',
				label: '240p',
			},
			{
				id: 'medium',
				height: 480,
				bitrate: 1000000,
				url: 'manifest_480p.m3u8',
				label: '480p',
			},
			{
				id: 'high',
				height: 720,
				bitrate: 2500000,
				url: 'manifest_720p.m3u8',
				label: '720p',
			},
			{
				id: 'ultra',
				height: 1080,
				bitrate: 5000000,
				url: 'manifest_1080p.m3u8',
				label: '1080p',
			},
		];

		this.currentQualityIndex = 1; // Start conservatively
		this.bandwidthMeasurements = [];
		this.switchHistory = [];
		this.isUserOverride = false;
		this.deviceCapabilities = this.detectDeviceCapabilities();

		this.startAdaptation();
	}

	detectDeviceCapabilities() {
		const screen = window.screen;
		const connection =
			navigator.connection || navigator.mozConnection || navigator.webkitConnection;

		return {
			maxResolution: Math.min(screen.width, screen.height),
			memoryGB: navigator.deviceMemory || 4, // Default to 4GB
			connectionType: connection ? connection.effectiveType : '4g',
			isMobile: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent),
			hardwareAcceleration: this.checkHardwareAcceleration(),
		};
	}

	checkHardwareAcceleration() {
		// Simple hardware acceleration detection
		const canvas = document.createElement('canvas');
		const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
		return gl ? gl.getParameter(gl.RENDERER).includes('GPU') : false;
	}

	startAdaptation() {
		// Multiple adaptation intervals
		setInterval(() => this.measureThroughput(), 2000);
		setInterval(() => this.adaptQuality(), 5000);
		setInterval(() => this.cleanupHistory(), 30000);

		// React to video events
		this.player.video.addEventListener('waiting', () => this.onBuffering());
		this.player.video.addEventListener('canplaythrough', () => this.onBufferRecovered());
	}

	async measureThroughput() {
		const startTime = performance.now();
		const testSize = this.selectTestSize();

		try {
			const response = await fetch(`/bandwidth-test?size=${testSize}&t=${Date.now()}`, {
				cache: 'no-cache',
			});

			const data = await response.arrayBuffer();
			const endTime = performance.now();

			const duration = (endTime - startTime) / 1000; // seconds
			const throughput = (data.byteLength * 8) / duration; // bits per second

			this.addBandwidthMeasurement(throughput);
		} catch (error) {
			console.warn('Throughput measurement failed:', error);
		}
	}

	selectTestSize() {
		// Adaptive test size based on current quality
		const currentQuality = this.qualityLevels[this.currentQualityIndex];
		return Math.min(100000, currentQuality.bitrate / 8); // 1 second worth of data
	}

	addBandwidthMeasurement(throughput) {
		this.bandwidthMeasurements.push({
			timestamp: Date.now(),
			value: throughput,
		});

		// Keep only recent measurements (last 60 seconds)
		const cutoff = Date.now() - 60000;
		this.bandwidthMeasurements = this.bandwidthMeasurements.filter(
			(m) => m.timestamp > cutoff,
		);
	}

	calculateAvailableBandwidth() {
		if (this.bandwidthMeasurements.length < 3) {
			return this.qualityLevels[1].bitrate; // Default to medium quality
		}

		// Use harmonic mean for more conservative estimate
		const weights = this.bandwidthMeasurements.map((_, i) => i + 1);
		const weightedSum = this.bandwidthMeasurements.reduce(
			(sum, measurement, i) => sum + measurement.value * weights[i],
			0,
		);
		const totalWeight = weights.reduce((a, b) => a + b, 0);

		return weightedSum / totalWeight;
	}

	adaptQuality() {
		if (this.isUserOverride) return;

		const availableBandwidth = this.calculateAvailableBandwidth();
		const bufferHealth = this.analyzeBufferHealth();
		const deviceScore = this.calculateDeviceScore();

		const targetQuality = this.selectOptimalQuality(
			availableBandwidth,
			bufferHealth,
			deviceScore,
		);

		if (targetQuality !== this.currentQualityIndex) {
			this.switchQuality(targetQuality, 'automatic');
		}
	}

	analyzeBufferHealth() {
		const bufferLength = this.player.getBufferLength();
		const video = this.player.video;

		return {
			length: bufferLength,
			ratio: bufferLength / 30, // Target 30 seconds
			isStarving: bufferLength < 3,
			isHealthy: bufferLength > 15,
			isAbundant: bufferLength > 45,
			playbackRate: video.playbackRate || 1,
			isBuffering: video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA,
		};
	}

	calculateDeviceScore() {
		let score = 1.0;

		// Screen resolution factor
		if (this.deviceCapabilities.maxResolution < 720) score *= 0.6;
		else if (this.deviceCapabilities.maxResolution < 1080) score *= 0.8;

		// Memory factor
		if (this.deviceCapabilities.memoryGB < 2) score *= 0.5;
		else if (this.deviceCapabilities.memoryGB < 4) score *= 0.7;

		// Connection type factor
		if (this.deviceCapabilities.connectionType === 'slow-2g') score *= 0.2;
		else if (this.deviceCapabilities.connectionType === '2g') score *= 0.4;
		else if (this.deviceCapabilities.connectionType === '3g') score *= 0.7;

		// Mobile penalty for battery life
		if (this.deviceCapabilities.isMobile) score *= 0.8;

		return Math.max(0.1, Math.min(1.0, score));
	}

	selectOptimalQuality(bandwidth, bufferHealth, deviceScore) {
		// Safety margin - use 70% of available bandwidth
		const usableBandwidth = bandwidth * 0.7 * deviceScore;

		// Emergency downgrade for critical buffer
		if (bufferHealth.isStarving) {
			return Math.max(0, this.currentQualityIndex - 2);
		}

		// Conservative downgrade for low buffer
		if (bufferHealth.length < 8 && !bufferHealth.isHealthy) {
			return Math.max(0, this.currentQualityIndex - 1);
		}

		// Find highest sustainable quality
		let targetIndex = 0;
		for (let i = this.qualityLevels.length - 1; i >= 0; i--) {
			if (this.qualityLevels[i].bitrate <= usableBandwidth) {
				targetIndex = i;
				break;
			}
		}

		// Prevent oscillation - require significant improvement for upgrade
		if (targetIndex > this.currentQualityIndex) {
			const requiredImprovement = this.qualityLevels[targetIndex].bitrate * 1.2;
			if (usableBandwidth < requiredImprovement) {
				targetIndex = this.currentQualityIndex;
			}
		}

		return targetIndex;
	}

	switchQuality(newIndex, reason) {
		const oldQuality = this.qualityLevels[this.currentQualityIndex];
		const newQuality = this.qualityLevels[newIndex];

		console.log(`Quality switch (${reason}): ${oldQuality.label} → ${newQuality.label}`);

		// Record switch for analysis
		this.switchHistory.push({
			timestamp: Date.now(),
			from: this.currentQualityIndex,
			to: newIndex,
			reason: reason,
			bandwidth: this.calculateAvailableBandwidth(),
			bufferLength: this.player.getBufferLength(),
		});

		this.currentQualityIndex = newIndex;

		// Trigger actual quality switch in player
		this.player.switchToQuality(newQuality);

		// Notify UI
		this.onQualityChanged(newQuality);
	}

	// Handle user manual quality selection
	setQualityOverride(qualityIndex) {
		this.isUserOverride = qualityIndex !== -1; // -1 means auto

		if (!this.isUserOverride) {
			// Re-enable automatic adaptation
			setTimeout(() => this.adaptQuality(), 1000);
		} else {
			this.switchQuality(qualityIndex, 'user_override');
		}
	}

	onBuffering() {
		console.log('Buffering detected - considering quality reduction');

		// Immediate quality reduction if we're not already at lowest
		if (this.currentQualityIndex > 0 && !this.isUserOverride) {
			this.switchQuality(
				Math.max(0, this.currentQualityIndex - 1),
				'buffering_emergency',
			);
		}
	}

	onBufferRecovered() {
		console.log('Buffer recovered');
		// Let normal adaptation handle quality increases
	}

	cleanupHistory() {
		const cutoff = Date.now() - 300000; // Keep 5 minutes of history
		this.switchHistory = this.switchHistory.filter((s) => s.timestamp > cutoff);
	}

	// Analytics and debugging
	getPerformanceMetrics() {
		return {
			currentQuality: this.qualityLevels[this.currentQualityIndex],
			averageBandwidth: this.calculateAvailableBandwidth(),
			bufferHealth: this.analyzeBufferHealth(),
			recentSwitches: this.switchHistory.slice(-10),
			deviceScore: this.calculateDeviceScore(),
		};
	}
}
