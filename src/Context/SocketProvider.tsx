import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';

import { createSocketConnection } from './socketConnection';

interface SocketContextType {
	socket: Socket | null;
	isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
	socket: null,
	isConnected: false,
});

export const useSocket = () => {
	const context = useContext(SocketContext);
	if (context === undefined) {
		throw new Error('useSocket must be used within a SocketProvider');
	}
	return context;
};

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

	return (
		<SocketContext.Provider value={{ socket, isConnected }}>
			{children}
		</SocketContext.Provider>
	);
};
