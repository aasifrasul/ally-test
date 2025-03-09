import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import { constants } from '../constants';

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

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [socket, setSocket] = useState<Socket | null>(null);
	const [isConnected, setIsConnected] = useState(false);

	useEffect(() => {
		// Initialize socket connection
		const socketInstance = io(constants.BASE_URL);

		socketInstance.on('connect', () => {
			console.log('Connected to Socket.io server');
			setIsConnected(true);
		});

		socketInstance.on('disconnect', () => {
			console.log('Disconnected from Socket.io server');
			setIsConnected(false);
		});

		setSocket(socketInstance);

		// Clean up on unmount
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
