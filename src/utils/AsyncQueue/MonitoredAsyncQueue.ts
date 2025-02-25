import { AsyncQueue } from './index';

interface QueueMetrics {
	averageProcessingTime: number;
	totalProcessed: number;
	failureRate: number;
	queueLatency: number; // Not implemented yet, see explanation below
}

export class MonitoredAsyncQueue<T> extends AsyncQueue<T> {
	private metrics: QueueMetrics = {
		averageProcessingTime: 0,
		totalProcessed: 0,
		failureRate: 0,
		queueLatency: 0,
	};

	private totalProcessed: number = 0;
	private totalProcessingTime: number = 0;
	private totalFailures: number = 0;

	private updateMetrics(processingTime: number, success: boolean): void {
		this.totalProcessed++;
		this.totalProcessingTime += processingTime;

		if (!success) {
			this.totalFailures++;
		}

		this.metrics.averageProcessingTime =
			this.totalProcessed === 0 ? 0 : this.totalProcessingTime / this.totalProcessed;
		this.metrics.failureRate =
			this.totalProcessed === 0 ? 0 : this.totalFailures / this.totalProcessed;
	}

	async processQueue(): Promise<boolean> {
		const startTime = Date.now();
		try {
			const result = await super.processQueue();
			this.updateMetrics(Date.now() - startTime, true);
			return result;
		} catch (error) {
			this.updateMetrics(Date.now() - startTime, false);
			throw error; // Re-throw the error after updating metrics
		}
	}

	getMetrics(): QueueMetrics {
		return { ...this.metrics }; // Return a copy to prevent modification
	}

	// Optional: Reset metrics
	resetMetrics(): void {
		this.metrics = {
			averageProcessingTime: 0,
			totalProcessed: 0,
			failureRate: 0,
			queueLatency: 0,
		};
		this.totalProcessingTime = 0;
		this.totalFailures = 0;
	}
}
