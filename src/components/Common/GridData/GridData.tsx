import { JSX, useState, useEffect, useRef, useCallback } from 'react';
import { DataGrid, Column } from 'react-data-grid';
import { useSocket } from '../../../Context/SocketContextProvider';

const MAX_ROWS = 1000;
const BATCH_UPDATE_INTERVAL = 500; // Update UI every 500ms

interface Row {
	key: string;
	value: number;
	timestamp: number;
}

const columns: Column<Row>[] = [
	{ key: 'key', name: 'Currency Pair' },
	{ key: 'value', name: 'Ratio' },
];

function GridData(): JSX.Element {
	const { socket, isConnected } = useSocket();
	const [rows, setRows] = useState<Row[]>([]);

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
		if (isConnected) {
			socket!.emit('fetchCurrencyPair');
		}

		const handleCurrencyPairData = (data: Row) => {
			// Add timestamp and store in incoming data ref
			const rowWithTimestamp = { ...data, timestamp: Date.now() };
			incomingDataRef.current.push(rowWithTimestamp);
		};

		// Setup socket listeners
		socket!.on('currencyPairData', handleCurrencyPairData);

		// Connect socket if not already connected
		if (socket!.disconnected) {
			socket!.connect();
		}

		// Cleanup function
		return () => {
			socket!.off('currencyPairData', handleCurrencyPairData);
			socket!.emit('stopFetchCurrencyPair');
		};
	}, [socket, isConnected]);

	return (
		<div>
			{!isConnected && <div>{'Connecting to server...'}</div>}
			<DataGrid columns={columns} rows={rows} rowKeyGetter={(row) => row.timestamp} />
		</div>
	);
}

export default GridData;
