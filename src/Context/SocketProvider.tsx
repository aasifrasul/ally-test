import { createContext, ReactNode, useEffect, useMemo, useState } from 'react';
import type { Socket } from 'socket.io-client';

import { createContextProvider } from './contextProviderFactory';
import { createSocketConnection } from './socketConnection';

export interface SocketContextType {
	socket: Socket | null;
	isConnected: boolean;
}

export const SocketContext = createContext<SocketContextType>({
	socket: null,
	isConnected: false,
});

export function createSocketContext(): [
	React.FC<{ children?: ReactNode; value: SocketContextType }>,
	() => SocketContextType,
] {
	return createContextProvider(SocketContext, 'SocketProvider');
}

export const [SocketContextProvider, useSocketContext] = createSocketContext();
export const useSocket = useSocketContext;

export const SocketProvider = ({ children }: { children: ReactNode }) => {
	const [socket, setSocket] = useState<Socket | null>(null);
	const [isConnected, setIsConnected] = useState(false);

	useEffect(() => {
		const socketInstance = createSocketConnection({
			url: undefined,
			onConnect: () => {
				console.log('Connected to Socket.io server');
				setIsConnected(true);
			},
			onDisconnect: () => {
				console.log('Disconnected from Socket.io server');
				setIsConnected(false);
			},
			onConnectError: (error) => {
				console.error('Socket connection error:', error);
			},
		});

		setSocket(socketInstance);

		return () => {
			socketInstance.disconnect();
		};
	}, []);

	const value = useMemo(
		() => ({
			socket,
			isConnected,
		}),
		[socket, isConnected],
	);

	return <SocketContextProvider value={value}>{children}</SocketContextProvider>;
};
