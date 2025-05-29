/**
 * Advanced buffer analyzer for optimal segment scheduling
 */
class BufferAnalyzer {
	private video: HTMLVideoElement;

	constructor(video: HTMLVideoElement) {
		this.video = video;
	}

	public analyzeBuffer(): {
		totalBuffered: number;
		bufferGaps: { start: number; end: number }[];
		bufferAhead: number;
		bufferBehind: number;
	} {
		const buffered = this.video.buffered;
		const currentTime = this.video.currentTime;

		let totalBuffered = 0;
		let bufferAhead = 0;
		let bufferBehind = 0;
		const bufferGaps: { start: number; end: number }[] = [];

		// Calculate total buffered time
		for (let i = 0; i < buffered.length; i++) {
			totalBuffered += buffered.end(i) - buffered.start(i);

			if (buffered.end(i) > currentTime) {
				bufferAhead +=
					Math.min(buffered.end(i), currentTime) -
					Math.max(buffered.start(i), currentTime);
			}

			if (buffered.start(i) < currentTime) {
				bufferBehind += Math.min(buffered.end(i), currentTime) - buffered.start(i);
			}
		}

		// Find buffer gaps
		for (let i = 0; i < buffered.length - 1; i++) {
			if (buffered.end(i) < buffered.start(i + 1)) {
				bufferGaps.push({
					start: buffered.end(i),
					end: buffered.start(i + 1),
				});
			}
		}

		return {
			totalBuffered,
			bufferGaps,
			bufferAhead: Math.max(0, bufferAhead),
			bufferBehind: Math.max(0, bufferBehind),
		};
	}

	public shouldPrioritizeGapFilling(): boolean {
		const analysis = this.analyzeBuffer();
		return analysis.bufferGaps.length > 0 && analysis.bufferAhead < 10;
	}
}
