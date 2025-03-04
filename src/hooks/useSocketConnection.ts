import { useEffect, useState, useCallback, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { constants } from '../constants';

// Constants
const RECONNECTION_ATTEMPTS = 3;
const RECONNECTION_DELAY = 2000;

enum Status {
	CONNECTED = 'connected',
	DISCONNECTED = 'disconnected',
	ERROR = 'error',
}

export function useSocketConnection(onConnectionCallback?: () => void): {
	socket: Socket | null;
	connectionStatus: Status;
} {
	const socketRef = useRef<Socket | null>(null);
	const [connectionStatus, setConnectionStatus] = useState<Status>(Status.DISCONNECTED);
	const reconnectAttemptsRef = useRef(0);

	const initializeSocket = useCallback(() => {
		socketRef.current = io(constants.BASE_URL, {
			reconnectionAttempts: RECONNECTION_ATTEMPTS,
			reconnectionDelay: RECONNECTION_DELAY,
			transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
		});

		socketRef.current.on('connect', () => {
			setConnectionStatus(Status.CONNECTED);
			onConnectionCallback?.();
			reconnectAttemptsRef.current = 0;
		});

		socketRef.current.on('disconnect', () => {
			setConnectionStatus(Status.DISCONNECTED);
		});

		socketRef.current.on('connect_error', (error) => {
			console.error('Socket connection error:', error);
			setConnectionStatus(Status.ERROR);

			if (reconnectAttemptsRef.current < RECONNECTION_ATTEMPTS) {
				reconnectAttemptsRef.current++;
				setTimeout(() => {
					socketRef.current?.connect();
				}, RECONNECTION_DELAY);
			}
		});

		return () => {
			socketRef.current?.disconnect();
		};
	}, []);

	useEffect(() => {
		const cleanup = initializeSocket();
		return cleanup;
	}, [initializeSocket]);

	return { socket: socketRef.current, connectionStatus };
}
