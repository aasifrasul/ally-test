class ApiClient {
	constructor(config) {
		this.config = config;
	}

	/**
	 * Send batch to server
	 * @param {Object} batch - Batch to send
	 * @returns {Promise} - API response
	 */
	async sendBatch(batch) {
		try {
			// Check connectivity
			if (!(await this.checkConnectivity())) {
				return {
					success: false,
					error: 'No network connectivity',
					statusCode: 0,
					retryable: true,
				};
			}

			if (this.config.USE_SERVICE_WORKER) {
				return this._sendViaSW(batch);
			} else {
				return this._sendViaFetch(batch);
			}
		} catch (error) {
			console.error('API request failed:', error);
			return {
				success: false,
				error: error.message,
				statusCode: 0,
				retryable: true,
			};
		}
	}

	/**
	 * Send batch via Service Worker
	 * @param {Object} batch - Batch to send
	 * @returns {Promise} - API response
	 */
	async _sendViaSW(batch) {
		return new Promise((resolve, reject) => {
			// Create a channel to communicate with the Service Worker
			const messageChannel = new MessageChannel();

			messageChannel.port1.onmessage = (event) => {
				if (event.data.error) {
					resolve({
						success: false,
						error: event.data.error,
						statusCode: event.data.statusCode || 0,
						retryable: event.data.retryable !== false, // Default to true
					});
				} else {
					resolve({
						success: true,
						data: event.data.data,
						statusCode: event.data.statusCode || 200,
					});
				}
			};

			// Send to Service Worker
			navigator.serviceWorker.controller.postMessage(
				{
					type: 'analytics_batch',
					url: this.config.API_ENDPOINT,
					headers: this.config.API_HEADERS,
					batch: batch,
				},
				[messageChannel.port2],
			);

			// Set timeout
			setTimeout(() => {
				resolve({
					success: false,
					error: 'Service Worker response timeout',
					statusCode: 0,
					retryable: true,
				});
			}, 30000); // 30 second timeout
		});
	}

	/**
	 * Send batch via fetch
	 * @param {Object} batch - Batch to send
	 * @returns {Promise} - API response
	 */
	async _sendViaFetch(batch) {
		const response = await fetch(this.config.API_ENDPOINT, {
			method: 'POST',
			headers: this.config.API_HEADERS,
			body: JSON.stringify(batch.events),
		});

		return this.handleResponse(response);
	}

	/**
	 * Check network connectivity
	 * @returns {Promise<boolean>} - True if connectivity available
	 */
	async checkConnectivity() {
		if ('navigator' in self && 'onLine' in navigator && !navigator.onLine) {
			return false;
		}

		// Try a HEAD request
		try {
			const response = await fetch(this.config.API_ENDPOINT, {
				method: 'HEAD',
				cache: 'no-cache',
			});
			return response.ok;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Process API response
	 * @param {Response} response - Fetch API response
	 * @returns {Object} - Processed response
	 */
	async handleResponse(response) {
		let data;

		if (response.ok) {
			try {
				data = await response.json();
				return {
					success: true,
					data,
					statusCode: response.status,
				};
			} catch (error) {
				data = null;
			}
		}

		// Determine if error is retryable
		const isRetryable = response.status >= 500 || response.status === 429;

		return {
			success: false,
			error: data?.error || `HTTP error ${response.status}`,
			statusCode: response.status,
			retryable: isRetryable,
			data,
		};
	}
}
