import { AsyncQueue } from './index';

interface RetryConfig {
	maxAttempts: number;
	backoffMs: number;
}

export class RetryAsyncQueue<T> extends AsyncQueue<T> {
	async processQueue(retryConfig?: RetryConfig): Promise<boolean> {
		let attempts = 0;

		while (attempts < (retryConfig?.maxAttempts || 1)) {
			try {
				return await super.processQueue();
			} catch (error) {
				attempts++;
				if (attempts >= (retryConfig?.maxAttempts || 1)) throw error;
				await new Promise((resolve) =>
					setTimeout(resolve, retryConfig?.backoffMs || 1000 * attempts),
				);
			}
		}
		return false;
	}
}
