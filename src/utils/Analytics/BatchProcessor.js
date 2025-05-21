class BatchProcessor {
	constructor(config, queueManager, apiClient, storageManager, retryManager) {
		this.config = config;
		this.queueManager = queueManager;
		this.apiClient = apiClient;
		this.storageManager = storageManager;
		this.retryManager = retryManager;
    
		this.batchIdCounter = 0;
		this.batchingTimeoutId = null;
		this.isProcessing = false;
    
		// Bind methods for event listeners
		this.handleBrowserUnload = this.handleBrowserUnload.bind(this);
    
		// Set up browser unload handler
		if (this.config.RETRY_ON_RELOAD) {
			window.addEventListener('beforeunload', this.handleBrowserUnload);
		}
    
		// Schedule initial batch processing
		this.scheduleBatch();
    
		// Process any pending retries
		this.retryManager.processRetries();
    
		// Try to recover any stored events
		this.recoverStoredEvents();
	}

	/**
	 * Create a new batch from events
	 * @param {Array} events - Events to include in batch
	 * @returns {Object} - Batch object
	 */
	createBatch(events) {
		if (!events || events.length === 0) return null;
    
		return {
			id: `batch_${++this.batchIdCounter}_${Date.now()}`,
			events,
			size: events.length,
			createdAt: Date.now()
		};
	}

	/**
	 * Process and send a batch
	 * @param {Object} batch - Batch to process
	 * @returns {Promise}
	 */
	async processBatch(batch) {
		if (!batch || batch.events.length === 0) return;
    
		const result = await this.apiClient.sendBatch(batch);
    
		if (result.success) {
			// Success - remove events from storage if they were there
			const eventIds = batch.events.map(event => event.id);
			await this.storageManager.clearEvents(eventIds);
		} else if (result.retryable) {
			// Failed but retryable - handle via retry manager
			this.retryManager.scheduleRetry(batch, 1);
		} else {
			// Failed and not retryable - handle according to config
			if (this.config.FAILED_EVENT_STRATEGY === 'keep') {
				await this.storageManager.saveEvents(batch.events);
			}
		}
    
		return result;
	}

	/**
	 * Schedule batch processing based on thresholds
	 */
	scheduleBatch() {
		if (this.batchingTimeoutId) {
			clearTimeout(this.batchingTimeoutId);
		}
    
		this.batchingTimeoutId = setTimeout(() => {
			this.attemptProcessing();
		}, this.config.IDLE_THRESHOLD);
	}

	/**
	 * Attempt to process events in the queue
	 */
	async attemptProcessing() {
		if (this.isProcessing) {
			this.scheduleBatch();
			return;
		}
    
		this.isProcessing = true;
    
		try {
			// Get events from queue up to max batch size
			const events = this.queueManager.getEvents(this.config.MAX_BATCH_SIZE);
      
			if (events.length > 0) {
				const batch = this.createBatch(events);
				await this.processBatch(batch);
			}
		} finally {
			this.isProcessing = false;
			this.scheduleBatch();
		}
	}

	/**
	 * Prioritize batches by importance if needed
	 * @param {Array} batches - Batches to prioritize
	 * @returns {Array} - Prioritized batches
	 */
	prioritizeBatches(batches) {
		// Example implementation - prioritize by age (oldest first)
		return batches.sort((a, b) => a.createdAt - b.createdAt);
	}

	/**
	 * Force send all pending events
	 * @returns {Promise}
	 */
	async flush() {
		// Cancel current timing
		if (this.batchingTimeoutId) {
			clearTimeout(this.batchingTimeoutId);
			this.batchingTimeoutId = null;
		}
    
		// Wait for any current processing to complete
		if (this.isProcessing) {
			await new Promise(resolve => {
				const checkProcessing = () => {
					if (!this.isProcessing) {
						resolve();
					} else {
						setTimeout(checkProcessing, 50);
					}
				};
				checkProcessing();
			});
		}
    
		this.isProcessing = true;
    
		try {
			// Process all events in queue
			while (!this.queueManager.isEmpty()) {
				const events = this.queueManager.getEvents(this.config.MAX_BATCH_SIZE);
				if (events.length > 0) {
					const batch = this.createBatch(events);
					await this.processBatch(batch);
				}
			}
      
			// Try to process any stored events
			await this.processStoredEvents();
		} finally {
			this.isProcessing = false;
			this.scheduleBatch();
		}
	}

	/**
	 * Handle browser unload event
	 */
	handleBrowserUnload() {
		// Save any events from queue that haven't been sent yet
		if (!this.queueManager.isEmpty()) {
			const remainingEvents = this.queueManager.getEvents(this.queueManager.size());
			if (remainingEvents.length > 0) {
				// Use synchronous localStorage for unload event
				try {
					this.storageManager.saveEvents(remainingEvents);
				} catch (error) {
					console.error('Failed to save events during unload:', error);
				}
			}
		}
	}

	/**
	 * Try to recover and send stored events
	 */
	async recoverStoredEvents() {
		// Small delay to let page load
		setTimeout(async () => {
			await this.processStoredEvents();
		}, 1000);
	}

	/**
	 * Process events from storage
	 */
	async processStoredEvents() {
		const events = await this.storageManager.loadEvents();
    
		if (events.length === 0) return;
    
		// Process in batches
		for (let i = 0; i < events.length; i += this.config.MAX_BATCH_SIZE) {
			const batchEvents = events.slice(i, i + this.config.MAX_BATCH_SIZE);
			const batch = this.createBatch(batchEvents);
      
			if (batch) {
				await this.processBatch(batch);
			}
		}
	}

	/**
	 * Clean up resources
	 */
	cleanup() {
		if (this.batchingTimeoutId) {
			clearTimeout(this.batchingTimeoutId);
			this.batchingTimeoutId = null;
		}
    
		if (this.config.RETRY_ON_RELOAD) {
			window.removeEventListener('beforeunload', this.handleBrowserUnload);
		}
    
		this.retryManager.clearRetries();
	}
}