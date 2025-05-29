class RetryManager {
	constructor(config, apiClient, storageManager) {
		this.config = config;
		this.apiClient = apiClient;
		this.storageManager = storageManager;
		this.retryQueue = new Map();
	}

	/**
	 * Schedule retry with backoff
	 * @param {Object} batch - Batch to retry
	 * @param {number} attempt - Current attempt number
	 */
	scheduleRetry(batch, attempt) {
		if (attempt >= this.config.MAX_RETRIES) {
			this.handleMaxRetries(batch);
			return;
		}

		const delay = this.calculateRetryDelay(attempt);
		const batchId = batch.id;
		const retryTime = Date.now() + delay;

		// Save retry info to storage
		const retryInfo = {
			attempt,
			scheduledTime: retryTime,
			events: batch.events,
			createdAt: batch.createdAt,
		};

		this.storageManager.saveRetryInfo(batchId, retryInfo);

		// Schedule retry
		const timeoutId = setTimeout(() => this.executeRetry(batchId), delay);

		// Store in memory for cancellation if needed
		this.retryQueue.set(batchId, {
			timeoutId,
			retryInfo,
		});
	}

	/**
	 * Calculate delay for retry based on strategy
	 * @param {number} attempt - Current attempt number
	 * @returns {number} - Delay in milliseconds
	 */
	calculateRetryDelay(attempt) {
		const baseDelay = this.config.INITIAL_RETRY_DELAY;

		if (this.config.RETRY_STRATEGY === 'linear') {
			return baseDelay * attempt;
		} else {
			// exponential
			return baseDelay * Math.pow(2, attempt - 1);
		}
	}

	/**
	 * Execute retry for a batch
	 * @param {string} batchId - ID of batch to retry
	 */
	async executeRetry(batchId) {
		// Remove from queue
		const retryData = this.retryQueue.get(batchId);
		this.retryQueue.delete(batchId);
		let { retryInfo } = retryData || {};

		if (!retryInfo) {
			// Try to load from storage
			const retryBatches = await this.storageManager.getRetryBatches();
			retryInfo = retryBatches[batchId];

			if (!retryInfo) {
				console.warn(`No retry data found for batch ${batchId}`);
				return;
			}
		}

		// Create batch from retry data
		const batch = {
			id: batchId,
			events: retryInfo.events,
			createdAt: retryInfo.createdAt,
		};

		// Send batch
		const result = await this.apiClient.sendBatch(batch);

		if (result.success) {
			// Success - remove from storage
			const eventIds = batch.events.map((event) => event.id);
			await this.storageManager.clearEvents(eventIds);
			await this.storageManager.updateRetryStatus(batchId, 'succeeded');
		} else if (result.retryable) {
			// Failed but retryable - schedule next retry
			this.scheduleRetry(batch, retryInfo.attempt + 1);
		} else {
			// Failed and not retryable - handle max retries
			this.handleMaxRetries(batch);
		}
	}

	/**
	 * Process all pending retries (useful on page load)
	 */
	async processRetries() {
		const retryBatches = await this.storageManager.getRetryBatches();

		for (const [batchId, retryInfo] of Object.entries(retryBatches)) {
			const now = Date.now();
			const scheduledTime = retryInfo.scheduledTime;

			if (scheduledTime <= now) {
				// Past scheduled time - retry immediately
				this.executeRetry(batchId);
			} else {
				// Schedule for future
				const delay = scheduledTime - now;
				const timeoutId = setTimeout(() => this.executeRetry(batchId), delay);

				this.retryQueue.set(batchId, {
					timeoutId,
					retryInfo,
				});
			}
		}
	}

	/**
	 * Handle batches that hit max retries
	 * @param {Object} batch - Batch that failed
	 */
	async handleMaxRetries(batch) {
		const strategy = this.config.FAILED_EVENT_STRATEGY;

		if (strategy === 'keep') {
			// Keep events in storage for manual retry later
			const retryInfo = {
				attempt: this.config.MAX_RETRIES,
				status: 'max_retries_reached',
				events: batch.events,
				createdAt: batch.createdAt,
				updatedAt: Date.now(),
			};

			await this.storageManager.saveRetryInfo(batch.id, retryInfo);
		} else {
			// 'discard'
			// Remove events from storage
			const eventIds = batch.events.map((event) => event.id);
			await this.storageManager.clearEvents(eventIds);
			await this.storageManager.updateRetryStatus(batch.id, 'discarded');
		}
	}

	/**
	 * Clean up resources
	 */
	clearRetries() {
		// Clear all pending timeouts
		for (const [batchId, { timeoutId }] of this.retryQueue.entries()) {
			clearTimeout(timeoutId);
		}

		this.retryQueue.clear();
	}
}
