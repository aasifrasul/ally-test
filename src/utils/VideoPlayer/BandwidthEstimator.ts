/**
 * Bandwidth estimator for more accurate adaptive bitrate decisions
 */
class BandwidthEstimator {
	private samples: { size: number; duration: number; timestamp: number }[] = [];
	private readonly maxSamples = 20;
	private readonly sampleLifetime = 30000; // 30 seconds

	public addSample(bytes: number, durationMs: number): void {
		const now = Date.now();
		this.samples.push({
			size: bytes,
			duration: durationMs,
			timestamp: now,
		});

		// Remove old samples
		this.samples = this.samples.filter(
			(sample) => now - sample.timestamp < this.sampleLifetime,
		);

		// Keep only recent samples
		if (this.samples.length > this.maxSamples) {
			this.samples.shift();
		}
	}

	public getEstimate(): number {
		if (this.samples.length === 0) return 1000000; // 1 Mbps default

		// Calculate weighted average (more recent samples have higher weight)
		const now = Date.now();
		let totalBandwidth = 0;
		let totalWeight = 0;

		for (const sample of this.samples) {
			const age = now - sample.timestamp;
			const weight = Math.exp(-age / 10000); // Exponential decay
			const bandwidth = (sample.size * 8) / (sample.duration / 1000); // bits per second

			totalBandwidth += bandwidth * weight;
			totalWeight += weight;
		}

		return totalWeight > 0 ? totalBandwidth / totalWeight : 1000000;
	}
}
