import React from 'react';
import io from 'socket.io-client';
import { renderHook } from '@testing-library/react-hooks';

import { createSocketConnection } from '../socketConnection';
import { createSocketContext } from '../SocketProvider';

jest.mock('socket.io-client', () => {
	const mockSocket = {
		connect: jest.fn(),
		on: jest.fn(),
		disconnect: jest.fn(),
		emit: jest.fn(),
	};

	return {
		__esModule: true,
		default: jest.fn(() => mockSocket),
	};
});

describe('createSocketConnection', () => {
	it('creates a socket with stable connection options and connects it immediately', () => {
		const onConnect = jest.fn();
		const onDisconnect = jest.fn();
		const onConnectError = jest.fn();

		const socket = createSocketConnection({
			url: 'http://localhost:3000',
			reconnectionAttempts: 4,
			reconnectionDelay: 1500,
			onConnect,
			onDisconnect,
			onConnectError,
		});

		expect(io).toHaveBeenCalledWith(
			'http://localhost:3000',
			expect.objectContaining({
				reconnectionAttempts: 4,
				reconnectionDelay: 1500,
				transports: ['websocket', 'polling'],
			}),
		);
		expect(socket.connect).toHaveBeenCalledTimes(1);
		expect(socket.on).toHaveBeenCalledWith('connect', expect.any(Function));
		expect(socket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
		expect(socket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
	});

	it('creates an explicit socket context provider and hook', () => {
		const socket = { id: 'socket-1' } as any;
		const [SocketProvider, useSocketContext] = createSocketContext();

		const { result } = renderHook(() => useSocketContext(), {
			wrapper: ({ children }: { children: React.ReactNode }) =>
				React.createElement(
					SocketProvider,
					{ value: { socket, isConnected: true } },
					children,
				),
		});

		expect(result.current).toEqual({ socket, isConnected: true });
	});
});
