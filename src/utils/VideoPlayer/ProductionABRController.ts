// @ts-nocheck
type QualityLevel = {
	id: string;
	height: number;
	bitrate: number;
	url: string;
	label: string;
};

type DeviceCapabilities = {
	maxResolution: number;
	memoryGB: number;
	connectionType: string;
	isMobile: boolean;
	hardwareAcceleration: boolean;
};

class ProductionABRController {
	player: NetflixStylePlayer;
	qualityLevels: QualityLevel[];
	currentQualityIndex: number;
	bandwidthMeasurements: Array<{ timestamp: number; value: number }>;
	switchHistory: Array<{
		timestamp: number;
		from: number;
		to: number;
		reason: string;
		bandwidth: number;
		bufferLength: number;
	}>;
	isUserOverride: boolean;
	deviceCapabilities: DeviceCapabilities;

	constructor(player: NetflixStylePlayer) {
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

		this.currentQualityIndex = 1;
		this.bandwidthMeasurements = [];
		this.switchHistory = [];
		this.isUserOverride = false;
		this.deviceCapabilities = this.detectDeviceCapabilities();

		this.startAdaptation();
	}

	detectDeviceCapabilities(): DeviceCapabilities {
		const screen = window.screen;
		const connection =
			(
				navigator as Navigator & {
					connection?: { effectiveType?: string };
					mozillaConnection?: { effectiveType?: string };
					webkitConnection?: { effectiveType?: string };
				}
			).connection ||
			(navigator as Navigator & { mozConnection?: { effectiveType?: string } })
				.mozConnection ||
			(navigator as Navigator & { webkitConnection?: { effectiveType?: string } })
				.webkitConnection;

		return {
			maxResolution: Math.min(screen.width, screen.height),
			memoryGB: (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4,
			connectionType: connection ? connection.effectiveType || '4g' : '4g',
			isMobile: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent),
			hardwareAcceleration: this.checkHardwareAcceleration(),
		};
	}

	checkHardwareAcceleration(): boolean {
		const canvas = document.createElement('canvas');
		const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
		return !!gl && gl.getParameter(gl.RENDERER).includes('GPU');
	}

	startAdaptation(): void {
		setInterval(() => this.measureThroughput(), 2000);
		setInterval(() => this.adaptQuality(), 5000);
		setInterval(() => this.cleanupHistory(), 30000);

		this.player.video.addEventListener('waiting', () => this.onBuffering());
		this.player.video.addEventListener('canplaythrough', () => this.onBufferRecovered());
	}

	async measureThroughput(): Promise<void> {
		const startTime = performance.now();
		const testSize = this.selectTestSize();

		try {
			const response = await fetch(`/bandwidth-test?size=${testSize}&t=${Date.now()}`, {
				cache: 'no-cache',
			});

			const data = await response.arrayBuffer();
			const endTime = performance.now();

			const duration = (endTime - startTime) / 1000;
			const throughput = (data.byteLength * 8) / duration;

			this.addBandwidthMeasurement(throughput);
		} catch (error) {
			console.warn('Throughput measurement failed:', error);
		}
	}

	selectTestSize(): number {
		const currentQuality = this.qualityLevels[this.currentQualityIndex];
		return Math.min(100000, currentQuality.bitrate / 8);
	}

	addBandwidthMeasurement(throughput: number): void {
		this.bandwidthMeasurements.push({
			timestamp: Date.now(),
			value: throughput,
		});

		const cutoff = Date.now() - 60000;
		this.bandwidthMeasurements = this.bandwidthMeasurements.filter(
			(m) => m.timestamp > cutoff,
		);
	}

	calculateAvailableBandwidth(): number {
		if (this.bandwidthMeasurements.length < 3) {
			return this.qualityLevels[1].bitrate;
		}

		const weights = this.bandwidthMeasurements.map((_, i) => i + 1);
		const weightedSum = this.bandwidthMeasurements.reduce(
			(sum, measurement, i) => sum + measurement.value * weights[i],
			0,
		);
		const totalWeight = weights.reduce((a, b) => a + b, 0);

		return weightedSum / totalWeight;
	}

	adaptQuality(): void {
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

	analyzeBufferHealth(): {
		length: number;
		ratio: number;
		isStarving: boolean;
		isHealthy: boolean;
		isAbundant: boolean;
		playbackRate: number;
		isBuffering: boolean;
	} {
		const bufferLength = this.player.getBufferLength();
		const video = this.player.video;

		return {
			length: bufferLength,
			ratio: bufferLength / 30,
			isStarving: bufferLength < 3,
			isHealthy: bufferLength > 15,
			isAbundant: bufferLength > 45,
			playbackRate: video.playbackRate || 1,
			isBuffering: video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA,
		};
	}

	calculateDeviceScore(): number {
		let score = 1.0;

		if (this.deviceCapabilities.maxResolution < 720) score *= 0.6;
		else if (this.deviceCapabilities.maxResolution < 1080) score *= 0.8;

		if (this.deviceCapabilities.memoryGB < 2) score *= 0.5;
		else if (this.deviceCapabilities.memoryGB < 4) score *= 0.7;

		if (this.deviceCapabilities.connectionType === 'slow-2g') score *= 0.2;
		else if (this.deviceCapabilities.connectionType === '2g') score *= 0.4;
		else if (this.deviceCapabilities.connectionType === '3g') score *= 0.7;

		if (this.deviceCapabilities.isMobile) score *= 0.8;

		return Math.max(0.1, Math.min(1.0, score));
	}

	selectOptimalQuality(
		bandwidth: number,
		bufferHealth: ReturnType<this['analyzeBufferHealth']>,
		deviceScore: number,
	): number {
		const usableBandwidth = bandwidth * 0.7 * deviceScore;

		if (bufferHealth.isStarving) {
			return Math.max(0, this.currentQualityIndex - 2);
		}

		if (bufferHealth.length < 8 && !bufferHealth.isHealthy) {
			return Math.max(0, this.currentQualityIndex - 1);
		}

		let targetIndex = 0;
		for (let i = this.qualityLevels.length - 1; i >= 0; i--) {
			if (this.qualityLevels[i].bitrate <= usableBandwidth) {
				targetIndex = i;
				break;
			}
		}

		if (targetIndex > this.currentQualityIndex) {
			const requiredImprovement = this.qualityLevels[targetIndex].bitrate * 1.2;
			if (usableBandwidth < requiredImprovement) {
				targetIndex = this.currentQualityIndex;
			}
		}

		return targetIndex;
	}

	switchQuality(newIndex: number, reason: string): void {
		const oldQuality = this.qualityLevels[this.currentQualityIndex];
		const newQuality = this.qualityLevels[newIndex];

		console.log(`Quality switch (${reason}): ${oldQuality.label} → ${newQuality.label}`);

		this.switchHistory.push({
			timestamp: Date.now(),
			from: this.currentQualityIndex,
			to: newIndex,
			reason,
			bandwidth: this.calculateAvailableBandwidth(),
			bufferLength: this.player.getBufferLength(),
		});

		this.currentQualityIndex = newIndex;
		this.player.switchToQuality(newQuality);
		this.onQualityChanged(newQuality);
	}

	setQualityOverride(qualityIndex: number): void {
		this.isUserOverride = qualityIndex !== -1;

		if (!this.isUserOverride) {
			setTimeout(() => this.adaptQuality(), 1000);
		} else {
			this.switchQuality(qualityIndex, 'user_override');
		}
	}

	onQualityChanged(_quality: QualityLevel): void {
		// no-op for demo integration
	}

	onBuffering(): void {
		console.log('Buffering detected - considering quality reduction');

		if (this.currentQualityIndex > 0 && !this.isUserOverride) {
			this.switchQuality(
				Math.max(0, this.currentQualityIndex - 1),
				'buffering_emergency',
			);
		}
	}

	onBufferRecovered(): void {
		console.log('Buffer recovered');
	}

	cleanupHistory(): void {
		const cutoff = Date.now() - 300000;
		this.switchHistory = this.switchHistory.filter((s) => s.timestamp > cutoff);
	}

	getPerformanceMetrics(): {
		currentQuality: QualityLevel;
		averageBandwidth: number;
		bufferHealth: ReturnType<this['analyzeBufferHealth']>;
		recentSwitches: Array<{
			timestamp: number;
			from: number;
			to: number;
			reason: string;
			bandwidth: number;
			bufferLength: number;
		}>;
		deviceScore: number;
	} {
		return {
			currentQuality: this.qualityLevels[this.currentQualityIndex],
			averageBandwidth: this.calculateAvailableBandwidth(),
			bufferHealth: this.analyzeBufferHealth(),
			recentSwitches: this.switchHistory.slice(-10),
			deviceScore: this.calculateDeviceScore(),
		};
	}
}
