import { io, Socket } from 'socket.io-client';

interface Row {
	key: string;
	value: number;
	timestamp: number;
}

class DataProcessor {
	private socket: Socket | null = null;
	private rows: Row[] = [];
	private maxRows: number = 1000;
	private batchInterval: number = 500;
	private batchUpdateTimer: number | null = null;

	initializeSocket(baseUrl: string) {
		// Disconnect existing socket if any
		if (this.socket) {
			this.socket.disconnect();
		}

		// Create new socket connection
		this.socket = io(baseUrl, {
			reconnection: true,
			reconnectionAttempts: 3,
			reconnectionDelay: 2000,
		});

		// Socket event handlers
		this.socket.on('connect', () => {
			this.postMessage('connectionStatus', 'connected');
			this.socket?.emit('fetchCurrencyPair');
		});

		this.socket.on('disconnect', () => {
			this.postMessage('connectionStatus', 'disconnected');
		});

		this.socket.on('connect_error', (error) => {
			console.error('Socket connection error:', error);
			this.postMessage('connectionStatus', 'error');
		});

		// Handle incoming data
		this.socket.on('currencyPairData', this.handleIncomingData.bind(this));

		// Start batch update timer
		this.startBatchUpdateTimer();
	}

	private handleIncomingData(data: Row) {
		// Add timestamp and store in rows
		const rowWithTimestamp = { ...data, timestamp: Date.now() };
		this.rows.unshift(rowWithTimestamp);

		// Trim to max rows
		if (this.rows.length > this.maxRows) {
			this.rows = this.rows.slice(0, this.maxRows);
		}
	}

	private startBatchUpdateTimer() {
		// Clear existing timer
		if (this.batchUpdateTimer) {
			clearInterval(this.batchUpdateTimer as unknown as number);
		}

		// Create new batch update timer
		this.batchUpdateTimer = setInterval(() => {
			// Send processed rows back to main thread
			this.postMessage('processedData', [...this.rows]);
		}, this.batchInterval) as unknown as number;
	}

	private postMessage(type: string, data: any) {
		// Send message to main thread
		self.postMessage({ type, data });
	}

	stopProcessing() {
		// Clean up socket and timer
		if (this.socket) {
			this.socket.emit('stopFetchCurrencyPair');
			this.socket.disconnect();
		}

		if (this.batchUpdateTimer) {
			clearInterval(this.batchUpdateTimer as unknown as number);
		}
	}
}

// Web Worker message handler
const dataProcessor = new DataProcessor();

self.addEventListener('message', (event) => {
	const { type, payload } = event.data;

	switch (type) {
		case 'initializeSocket':
			dataProcessor.initializeSocket(payload.baseUrl);
			break;
		case 'stopProcessing':
			dataProcessor.stopProcessing();
			break;
	}
});
