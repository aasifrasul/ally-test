import { useEffect, useState, useCallback, useRef } from 'react';
import type { Socket } from 'socket.io-client';

import { constants } from '../constants';
import { createSocketConnection } from '../Context/socketConnection';

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
		socketRef.current = createSocketConnection({
			url: constants.BASE_URL,
			reconnectionAttempts: RECONNECTION_ATTEMPTS,
			reconnectionDelay: RECONNECTION_DELAY,
			onConnect: () => {
				setConnectionStatus(Status.CONNECTED);
				onConnectionCallback?.();
				reconnectAttemptsRef.current = 0;
			},
			onDisconnect: () => {
				setConnectionStatus(Status.DISCONNECTED);
			},
			onConnectError: (error) => {
				console.error('Socket connection error:', error);
				setConnectionStatus(Status.ERROR);

				if (reconnectAttemptsRef.current < RECONNECTION_ATTEMPTS) {
					reconnectAttemptsRef.current++;
					setTimeout(() => {
						socketRef.current?.connect();
					}, RECONNECTION_DELAY);
				}
			},
		});

		return () => {
			socketRef.current?.disconnect();
		};
	}, [onConnectionCallback]);

	useEffect(() => {
		const cleanup = initializeSocket();
		return cleanup;
	}, [initializeSocket]);

	return { socket: socketRef.current, connectionStatus };
}
