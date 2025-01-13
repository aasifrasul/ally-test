import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDataGrid, { Column } from 'react-data-grid';
import { io, Socket } from 'socket.io-client';

// Constants
const SOCKET_URL = 'http://localhost:3100';
const RECONNECTION_ATTEMPTS = 3;
const RECONNECTION_DELAY = 2000;

interface Row {
	key: string;
	value: number;
}

interface Queue {
	enqueue: (data: Row) => void;
	dequeue: () => Row | undefined;
}

interface GridDataProps {
	queue: Queue;
}

const columns: Column<Row>[] = [
	{ key: 'key', name: 'Currency Pair' },
	{ key: 'value', name: 'Ratio' },
];

function GridData({ queue }: GridDataProps): JSX.Element {
	const [rows, setRows] = useState<Row[]>([]);
	const [connectionStatus, setConnectionStatus] = useState<
		'connected' | 'disconnected' | 'error'
	>('disconnected');
	const rafRef = useRef<number | null>(null);
	const socketRef = useRef<Socket | null>(null);
	const reconnectAttemptsRef = useRef(0);

	const setRowsData = useCallback(() => {
		const data: Row[] = [];
		let res = queue.dequeue();
		while (res) {
			data.push(res);
			res = queue.dequeue();
		}
		setRows((storedData) => [...data, ...storedData].slice(0, 1000)); // Prevent unlimited growth
		rafRef.current = null;
	}, [queue]);

	const addInQueue = useCallback(
		(data: Row) => {
			queue.enqueue(data);
			if (!rafRef.current) {
				rafRef.current = window.requestAnimationFrame(setRowsData);
			}
		},
		[queue, setRowsData],
	);

	const initializeSocket = useCallback(() => {
		socketRef.current = io(SOCKET_URL, {
			reconnectionAttempts: RECONNECTION_ATTEMPTS,
			reconnectionDelay: RECONNECTION_DELAY,
			transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
		});

		socketRef.current.on('connect', () => {
			setConnectionStatus('connected');
			reconnectAttemptsRef.current = 0;
			socketRef.current?.emit('fetchCurrencyPair');
		});

		socketRef.current.on('disconnect', () => {
			setConnectionStatus('disconnected');
		});

		socketRef.current.on('connect_error', (error) => {
			console.error('Socket connection error:', error);
			setConnectionStatus('error');

			if (reconnectAttemptsRef.current < RECONNECTION_ATTEMPTS) {
				reconnectAttemptsRef.current++;
				setTimeout(() => {
					socketRef.current?.connect();
				}, RECONNECTION_DELAY);
			}
		});

		socketRef.current.on('currencyPairData', addInQueue);

		return () => {
			if (rafRef.current) {
				window.cancelAnimationFrame(rafRef.current);
			}
			socketRef.current?.off('currencyPairData', addInQueue);
			socketRef.current?.emit('stopFetchCurrencyPair');
			socketRef.current?.disconnect();
		};
	}, [addInQueue]);

	useEffect(() => {
		const cleanup = initializeSocket();
		return cleanup;
	}, [initializeSocket]);

	return (
		<div className="grid-container">
			{connectionStatus !== 'connected' && (
				<div className="connection-status">
					{connectionStatus === 'disconnected' && 'Connecting to server...'}
					{connectionStatus === 'error' && 'Connection error. Retrying...'}
				</div>
			)}
			<ReactDataGrid columns={columns} rows={rows} />
		</div>
	);
}

export default GridData;
