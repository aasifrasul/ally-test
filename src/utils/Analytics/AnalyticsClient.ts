import { isString } from '../typeChecking';

/**
 * Main thread analytics client
 * Provides simple API and communicates with Web Worker
 */
class AnalyticsClient {
	constructor(options = {}) {
		this.workerId = 'analytics-worker';
		this.worker = null;
		this.isInitialized = false;
		this.pendingEvents = [];
		this.metadata = {
			sessionId: this._generateSessionId(),
			startTime: Date.now(),
			userAgent: navigator.userAgent,
			screenWidth: window.screen.width,
			screenHeight: window.screen.height,
		};

		this.init(options);
	}

	/**
	 * Initialize the analytics system
	 */
	async init(options) {
		// Register service worker if not already registered
		if ('serviceWorker' in navigator) {
			try {
				const registration =
					await navigator.serviceWorker.register('/analytics-sw.js');
				console.log(
					'Analytics Service Worker registered with scope:',
					registration.scope,
				);
			} catch (error) {
				console.error('Analytics Service Worker registration failed:', error);
			}
		}

		// Create Web Worker
		try {
			this.worker = new Worker('/analytics-worker.js');

			// Set up message handler
			this.worker.onmessage = (event) => {
				const { type, data } = event.data;

				if (type === 'initialized') {
					this.isInitialized = true;
					// Send any pending events
					this._sendPendingEvents();
				}
			};

			// Initialize the worker with configuration
			this.worker.postMessage({
				type: 'init',
				config: options,
			});
		} catch (error) {
			console.error('Failed to initialize Analytics Web Worker:', error);
		}
	}

	/**
	 * Track an event
	 * @param {string} eventType - Type of event to track
	 * @param {Object} eventData - Event data
	 * @param {boolean} [immediate=false] - Whether to process immediately
	 */
	trackEvent(eventType, eventData = {}, immediate = false) {
		if (!eventType) {
			console.error('Event type is required');
			return null;
		}

		// Create the event object
		const event = {
			type: eventType,
			data: eventData,
			timestamp: new Date().toISOString(),
			metadata: { ...this.metadata },
		};

		this._sendToWorker('track', { event, immediate });
		return true;
	}

	/**
	 * Track page view event
	 * @param {Object} pageData - Page data
	 * @param {boolean} [immediate=false] - Whether to process immediately
	 */
	trackPageView(pageData = {}, immediate = false) {
		// Enhance with default page info if not provided
		const enhancedData = {
			url: window.location.href,
			path: window.location.pathname,
			referrer: document.referrer,
			title: document.title,
			...pageData,
		};

		return this.trackEvent('pageview', enhancedData, immediate);
	}

	/**
	 * Track click event
	 * @param {HTMLElement|string} element - Element or selector that was clicked
	 * @param {Object} clickData - Additional click data
	 * @param {boolean} [immediate=false] - Whether to process immediately
	 */
	trackClick(element, clickData = {}, immediate = false) {
		let elementInfo = {};

		if (isString(element)) {
			// If element is a selector, try to find it
			const foundElement = document.querySelector(element);
			if (foundElement) {
				elementInfo = this._extractElementInfo(foundElement);
			} else {
				elementInfo = { selector: element, found: false };
			}
		} else if (element instanceof HTMLElement) {
			elementInfo = this._extractElementInfo(element);
		}

		return this.trackEvent('click', { ...elementInfo, ...clickData }, immediate);
	}

	/**
	 * Force send all pending events
	 * @returns {Promise}
	 */
	async flush() {
		return new Promise((resolve, reject) => {
			if (!this.worker) {
				reject(new Error('Analytics worker not initialized'));
				return;
			}

			const messageId = this._generateId();

			const handler = (event) => {
				const { type, id, success, error } = event.data;

				if (type === 'flush_result' && id === messageId) {
					this.worker.removeEventListener('message', handler);

					if (success) {
						resolve();
					} else {
						reject(new Error(error || 'Failed to flush events'));
					}
				}
			};

			this.worker.addEventListener('message', handler);

			this.worker.postMessage({
				type: 'flush',
				id: messageId,
			});

			// Set timeout for response
			setTimeout(() => {
				this.worker.removeEventListener('message', handler);
				reject(new Error('Flush operation timed out'));
			}, 10000); // 10 second timeout
		});
	}

	/**
	 * Clean up resources
	 */
	destroy() {
		if (this.worker) {
			this.worker.postMessage({ type: 'destroy' });
			this.worker.terminate();
			this.worker = null;
		}
		this.isInitialized = false;
	}

	/**
	 * Send message to worker, or queue if worker not ready
	 * @private
	 */
	_sendToWorker(type, data = {}) {
		const message = { type, ...data };

		if (this.worker && this.isInitialized) {
			this.worker.postMessage(message);
		} else {
			// Queue message to send when worker is ready
			this.pendingEvents.push(message);
		}
	}

	/**
	 * Send any pending events to the worker
	 * @private
	 */
	_sendPendingEvents() {
		if (this.pendingEvents.length > 0) {
			this.pendingEvents.forEach((event) => {
				this.worker.postMessage(event);
			});
			this.pendingEvents = [];
		}
	}

	/**
	 * Generate a unique ID
	 * @returns {string} - Unique ID
	 * @private
	 */
	_generateId() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			const r = (Math.random() * 16) | 0;
			const v = c === 'x' ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	}

	/**
	 * Generate a unique session ID
	 * @returns {string} - Session ID
	 * @private
	 */
	_generateSessionId() {
		return this._generateId();
	}

	/**
	 * Extract useful information from an HTML element
	 * @param {HTMLElement} element - Element to extract info from
	 * @returns {Object} - Element information
	 * @private
	 */
	_extractElementInfo(element) {
		if (!element) return {};

		return {
			tagName: element.tagName.toLowerCase(),
			id: element.id || undefined,
			className: element.className || undefined,
			text: element.innerText?.substring(0, 100) || undefined,
			href: element.href || undefined,
			value: element.value || undefined,
			type: element.type || undefined,
			name: element.name || undefined,
		};
	}
}

// Export for usage
window.AnalyticsClient = AnalyticsClient;

// Example usage
document.addEventListener('DOMContentLoaded', () => {
	const analytics = new AnalyticsClient({
		apiEndpoint: 'https://api.example.com/analytics',
		batchSize: 10,
		batchingInterval: 30000, // 30 seconds
		retryCount: 3,
		retryStrategy: 'exponential',
		storageType: 'localStorage',
	});

	// Expose analytics for debugging
	window.analytics = analytics;

	// Track page view
	analytics.trackPageView();

	// Example: Track button clicks
	document.querySelectorAll('button').forEach((button) => {
		button.addEventListener('click', (e) => {
			analytics.trackClick(e.target);
		});
	});

	// Example: Force flush events before navigating away
	document.querySelectorAll('a[data-flush-analytics]').forEach((link) => {
		link.addEventListener('click', async (e) => {
			e.preventDefault();

			try {
				await analytics.flush();
			} catch (error) {
				console.error('Could not flush analytics:', error);
			}

			// Continue with navigation
			window.location.href = link.href;
		});
	});
});
