import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDataGrid from 'react-data-grid';
import socketClient from 'socket.io-client';

const socket = socketClient.connect('http://localhost:3100');

const columns = [
	{ key: 'key', name: 'Currency Pair' },
	{ key: 'value', name: 'Ratio' },
];

function GridData({ queue }) {
	const [rows, setRows] = useState([]);
	const rafRef = useRef(null);

	const setRowsData = useCallback(() => {
		const data = [];
		let res = queue.dequeue();
		while (res) {
			data.push(res);
			res = queue.dequeue();
		}
		setRows((storedData) => [...data, ...storedData]);
		rafRef.current = null;
	}, [queue]);

	const addInQueue = useCallback(
		(data) => {
			queue.enqueue(data);
			if (!rafRef.current) {
				rafRef.current = window.requestAnimationFrame(setRowsData);
			}
		},
		[queue, setRowsData],
	);

	useEffect(() => {
		socket.emit('fetchCurrencyPair');
		socket.on('currencyPairData', addInQueue);

		return () => {
			if (rafRef.current) {
				window.cancelAnimationFrame(rafRef.current);
			}
			socket.off('currencyPairData', addInQueue);
			socket.emit('stopFetchCurrencyPair');
		};
	}, [addInQueue]);

	return <ReactDataGrid columns={columns} rows={rows} rowsCount={20} minHeight={150} />;
}

export default GridData;
