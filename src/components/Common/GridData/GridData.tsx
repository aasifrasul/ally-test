import { JSX, useState, useEffect, useRef, useCallback } from 'react';
import { DataGrid, Column } from 'react-data-grid';
import { io, Socket } from 'socket.io-client';
import { constants } from '../../../constants';

const MAX_ROWS = 1000;
const BATCH_UPDATE_INTERVAL = 500; // Update UI every 500ms

interface Row {
	key: string;
	value: number;
	timestamp: number;
}

enum ConnectionStatus {
	CONNECTED = 'connected',
	DISCONNECTED = 'disconnected',
	ERROR = 'error',
}

const columns: Column<Row>[] = [
	{ key: 'key', name: 'Currency Pair' },
	{ key: 'value', name: 'Ratio' },
];

function GridData(): JSX.Element {
	const [rows, setRows] = useState<Row[]>([]);
	const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
		ConnectionStatus.DISCONNECTED,
	);

	// Use a ref to store incoming data
	const incomingDataRef = useRef<Row[]>([]);
	const updateTimerRef = useRef<NodeJS.Timeout | null>(null);

	// Efficient data update mechanism
	const processIncomingData = useCallback(() => {
		if (incomingDataRef.current.length > 0) {
			setRows((prevRows) => {
				// Combine new data with existing rows
				const combinedRows = [...incomingDataRef.current, ...prevRows];

				// Trim to max rows
				const trimmedRows = combinedRows.slice(0, MAX_ROWS);

				// Clear incoming data ref
				incomingDataRef.current = [];

				return trimmedRows;
			});
		}
	}, []);

	// Periodic batch update
	useEffect(() => {
		updateTimerRef.current = setInterval(processIncomingData, BATCH_UPDATE_INTERVAL);

		return () => {
			if (updateTimerRef.current) {
				clearInterval(updateTimerRef.current);
			}
		};
	}, [processIncomingData]);

	// Socket initialization
	useEffect(() => {
		const socket = io(constants.BASE_URL);

		const handleConnect = () => {
			setConnectionStatus(ConnectionStatus.CONNECTED);
			socket.emit('fetchCurrencyPair');
		};

		const handleDisconnect = () => {
			setConnectionStatus(ConnectionStatus.DISCONNECTED);
		};

		const handleConnectError = (error: Error) => {
			console.error('Socket connection error:', error);
			setConnectionStatus(ConnectionStatus.ERROR);
		};

		const handleCurrencyPairData = (data: Row) => {
			// Add timestamp and store in incoming data ref
			const rowWithTimestamp = { ...data, timestamp: Date.now() };
			incomingDataRef.current.push(rowWithTimestamp);
		};

		// Setup socket listeners
		socket.on('connect', handleConnect);
		socket.on('disconnect', handleDisconnect);
		socket.on('connect_error', handleConnectError);
		socket.on('currencyPairData', handleCurrencyPairData);

		// Connect socket if not already connected
		if (socket.disconnected) {
			socket.connect();
		}

		// Cleanup function
		return () => {
			socket.off('connect', handleConnect);
			socket.off('disconnect', handleDisconnect);
			socket.off('connect_error', handleConnectError);
			socket.off('currencyPairData', handleCurrencyPairData);
			socket.emit('stopFetchCurrencyPair');
		};
	}, []);

	return (
		<div>
			{connectionStatus !== 'connected' && (
				<div>
					{connectionStatus === 'disconnected' && 'Connecting to server...'}
					{connectionStatus === 'error' && 'Connection error. Retrying...'}
				</div>
			)}
			<DataGrid columns={columns} rows={rows} rowKeyGetter={(row) => row.timestamp} />
		</div>
	);
}

export default GridData;
