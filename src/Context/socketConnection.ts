import io, { Socket } from 'socket.io-client';

import { constants } from '../constants';

export interface SocketConnectionOptions {
	url?: string;
	reconnectionAttempts?: number;
	reconnectionDelay?: number;
	transports?: Array<'websocket' | 'polling'>;
	onConnect?: () => void;
	onDisconnect?: () => void;
	onConnectError?: (error: Error) => void;
}

export function createSocketConnection(options: SocketConnectionOptions = {}): Socket {
	const socket = io(options.url ?? constants.BASE_URL, {
		reconnectionAttempts: options.reconnectionAttempts ?? 3,
		reconnectionDelay: options.reconnectionDelay ?? 2000,
		transports: options.transports ?? ['websocket', 'polling'],
	});

	socket.on('connect', () => {
		options.onConnect?.();
	});

	socket.on('disconnect', () => {
		options.onDisconnect?.();
	});

	socket.on('connect_error', (error: Error) => {
		options.onConnectError?.(error);
	});

	socket.connect();

	return socket;
}
