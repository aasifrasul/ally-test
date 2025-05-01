/**
 * Analytics Module
 *
 * Collects events, batches them, and sends them to a server via an API.
 * Handles failures by storing events in localStorage/IndexedDB and retrying.
 */

// Simple Queue implementation for event management
class Queue {
	constructor() {
		this.map = new Map();
		this.upperLimit = 0;
		this.lowerLimit = 0;
	}

	enqueue(item) {
		this.map.set(++this.upperLimit, item);
	}

	dequeue() {
		if (this.isEmpty()) {
			return null;
		}
		const key = ++this.lowerLimit;
		const result = this.map.get(key);
		this.map.delete(key);
		return result;
	}

	peek() {
		if (this.isEmpty()) return null;
		return this.map.get(this.upperLimit);
	}

	isEmpty() {
		return this.map.size === 0;
	}

	size() {
		return this.map.size;
	}

	clear() {
		this.map.clear();
	}
}

// Manage batching/Cordinate among diff pieces
class BatchProcessor {
	constructor(config) {
		this.queue = new Queue();

		this.storageManager = new StorageManager(config);
		this.apiManager = new APIManager(config);

		this.batchSize = config.batchSize;
		this.batchingInterval = config.batchingInterval;

		this.batchedEvents = [];
		this.isProcessing = false;
		this.batchingTimeoutId = null;

		this.startIntervalTimer();

		// Cross-reference components
		this.storageManager.setApiManager(this.apiManager);

		this.handleBrowserUnload = this.handleBrowserUnload.bind(this);
		this.processBatch = this.processBatch.bind(this);

		window.addEventListener('beforeunload', this.handleBrowserUnload);

		// Try to send any previously stored events
		this.recoverStoredEvents();
	}

	startIntervalTimer() {
		if (this.batchingTimeoutId) {
			clearTimeout(this.batchingTimeoutId);
			this.batchingTimeoutId = null;
		}

		this.batchingTimeoutId = setTimeout(() => this.processBatch(), this.batchingInterval);
	}

	// Add event to the queue
	trackEvent(event, processImmediately = false) {
		// Add timestamp if not present
		if (!event.timestamp) {
			event.timestamp = new Date().toISOString();
		}

		this.queue.enqueue(event);

		// Check if we should process right away
		if (processImmediately || this.queue.size() >= this.batchSize) {
			this.processBatch();
		}
	}

	processBatch() {
		if (this.isProcessing) {
			this.startIntervalTimer();
			return;
		}

		this.isProcessing = true;

		// Create a batch of events from the queue
		while (!this.queue.isEmpty() && this.batchedEvents.length < this.batchSize) {
			const event = this.queue.dequeue();
			if (event !== null) {
				this.batchedEvents.push(event);
			}
		}

		// If we have events to process, send them
		if (this.batchedEvents.length > 0) {
			this.sendBatchedEvents();
		}

		// Restart the timer for the next batch
		this.startIntervalTimer();
		this.isProcessing = false;
	}

	// Send the current batch to the API
	sendBatchedEvents() {
		const eventsToSend = [...this.batchedEvents];
		this.batchedEvents = [];

		this.apiManager.sendToEndPoint(eventsToSend, (error) => {
			if (error) {
				// On failure, store events for later retry
				this.storageManager.save(eventsToSend);
			}
		});
	}

	start() {
		this.processBatch();
	}

	// Handle browser unload event
	handleBrowserUnload() {
		// Save any events in the queue
		const remainingEvents = [];
		while (!this.queue.isEmpty()) {
			const event = this.queue.dequeue();
			if (event !== null) {
				remainingEvents.push(event);
			}
		}

		// Add any batched but unsent events
		if (this.batchedEvents.length > 0) {
			remainingEvents.push(...this.batchedEvents);
		}

		// Save to storage if we have events
		if (remainingEvents.length > 0) {
			this.storageManager.save(remainingEvents);
		}
	}

	// Try to recover and send stored events
	recoverStoredEvents() {
		setTimeout(() => {
			this.storageManager.attemptToSendToApi();
		}, 1000); // Small delay to let page load
	}

	// Clean up resources
	cleanUp() {
		if (this.batchingTimeoutId) {
			clearTimeout(this.batchingTimeoutId);
		}

		window.removeEventListener('beforeunload', this.handleBrowserUnload);

		// Process any remaining events
		this.processBatch();
	}
}

// Manages API requests and retries
class APIManager {
	constructor(config) {
		this.apiEndPoint = config.apiEndPoint;
		this.retryCount = config.retryCount || 3;
		this.retryDelay = config.retryDelay || 3000;
		this.headers = config.headers || {
			'Content-Type': 'application/json',
		};
	}

	async sendToEndPoint(events, callback, retryCount = 0) {
		if (!events || events.length === 0) {
			return callback && callback();
		}

		try {
			const response = await fetch(this.apiEndPoint, {
				method: 'POST',
				headers: this.headers,
				body: JSON.stringify(events),
			});

			if (!response.ok) {
				throw new Error(`API responded with status: ${response.status}`);
			}

			// Success
			callback && callback();
		} catch (error) {
			console.error('API request failed:', error);

			// Retry logic
			if (retryCount >= this.retryCount) {
				return callback && callback(error);
			}

			setTimeout(() => {
				this.sendToEndPoint(events, callback, retryCount + 1);
			}, this.retryDelay);
		}
	}
}

// handles persistence to localStorage or IndexedDB
class StorageManager {
	constructor(config) {
		this.storageType = config.storageType || 'localStorage';
		this.storageKey = config.storageKey || 'analytics_events';
		this.apiManager = null; // Will be set later
		this.batchSize = config.batchSize;
	}

	// Set API manager reference for retry functionality
	setApiManager(apiManager) {
		this.apiManager = apiManager;
	}

	// Save events to storage
	save(events) {
		if (!events || events.length === 0) return;

		try {
			if (this.storageType === 'localStorage') {
				const existingData = this.fetchSaveData();
				const updatedData = [...existingData, ...events];
				localStorage.setItem(this.storageKey, JSON.stringify(updatedData));
			} else if (this.storageType === 'indexedDB') {
				this.saveToIndexedDB(events);
			}
		} catch (error) {
			console.error('Failed to save events to storage:', error);
		}
	}

	// Fetch all stored events
	fetchSaveData() {
		try {
			if (this.storageType === 'localStorage') {
				const data = localStorage.getItem(this.storageKey);
				return data ? JSON.parse(data) : [];
			} else if (this.storageType === 'indexedDB') {
				return this.fetchFromIndexedDB();
			}
		} catch (error) {
			console.error('Failed to fetch batches from storage:', error);
			return [];
		}
	}

	// Clear all stored events
	clearStorage() {
		try {
			if (this.storageType === 'localStorage') {
				localStorage.removeItem(this.storageKey);
			} else if (this.storageType === 'indexedDB') {
				this.clearIndexedDB();
			}
		} catch (error) {
			console.error('Failed to clear storage:', error);
		}
	}

	// Attempt to send stored events to API
	attemptToSendToApi() {
		const events = this.fetchSaveData();
		if (events.length === 0) return;

		// Only proceed if apiManager is available
		if (!this.apiManager) {
			console.warn('API Manager not available for retrying stored events');
			return;
		}

		this.clearStorage();
		const batchedEvents = [];

		while (events.length > 0) {
			while (batchedEvents.length < this.batchSize && events.length > 0) {
				batchedEvents.push(events.pop());
			}

			const copyBatchedEvents = [...batchedEvents];

			this.apiManager.sendToEndPoint(copyBatchedEvents, (error) => {
				if (error) {
					// If still failing, save back to storage
					this.save(copyBatchedEvents);
				}
			});

			batchedEvents.length = 0;
		}
	}

	// IndexedDB implementation
	saveToIndexedDB(events) {
		// Implementation would go here
		console.warn('IndexedDB storage not fully implemented');
	}

	fetchFromIndexedDB() {
		// Implementation would go here
		console.warn('IndexedDB fetching not fully implemented');
		return [];
	}

	clearIndexedDB() {
		// Implementation would go here
		console.warn('IndexedDB clearing not fully implemented');
	}
}

// Example usage
const analyticsModule = new BatchProcessor({
	batchSize: 5,
	retryCount: 3,
	retryDelay: 3000,
	apiEndPoint: 'https://api.example.com/analytics',
	batchingInterval: 10000,
	storageType: 'localStorage',
	storageKey: 'analytics_events',
});

// Track some events
analyticsModule.trackEvent({ type: 'pageview', page: '/home' });
analyticsModule.trackEvent({ type: 'click', element: 'button', id: 'signup' });
analyticsModule.trackEvent({ type: 'click', element: 'button', id: 'login' });
analyticsModule.trackEvent({ type: 'form_submit', formId: 'contact' }, true); // Process immediately);
