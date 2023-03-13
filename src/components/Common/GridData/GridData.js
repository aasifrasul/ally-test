import React, { useState, useEffect, useRef } from 'react';
import ReactDataGrid from 'react-data-grid';
import socketClient from 'socket.io-client';

import { getArrayCount } from '../../../utils/typeChecking';

const socket = socketClient.connect('http://localhost:3100');

const columns = [
	{ key: 'key', name: 'Currency Pair' },
	{ key: 'value', name: 'Ratio' },
];

function GridData(props) {
	const { queue } = props;
	const [rows, setRows] = useState([]);
	const didMount = useRef(false);
	const rafRef = useRef(false);

	function setRowsData() {
		const data = [];
		let res = queue.dequeue();
		while (res) {
			console.log('res', res);
			data.push(res);
			res = queue.dequeue();
		}
		setRows((storedData) => {
			return [...data, ...storedData];
		});
		rafRef.current && window.cancelAnimationFrame(rafRef.current);
	}

	function addInQueue(data) {
		queue.enqueue(data);
		rafRef.current = window.requestAnimationFrame(setRowsData);
	}

	useEffect(() => {
		if (!didMount.current) {
			didMount.current = true;

			socket.emit('fetchCurrencyPair');
			socket.on('currencyPairData', addInQueue);
			/*
			const myWorker = new Worker('WebWorker.js');
			myWorker.postMessage('Helloooo');
			console.log('myWorker', myWorker);
			myWorker.onmessage = (e) => {
				console.log('myWorker', e.data);
			};
*/
		}

		return () => {
			didMount.current = false;
			window.cancelAnimationFrame(rafId);
			socket.emit('stopFetchCurrencyPair');
		};
	}, []);
	return <ReactDataGrid columns={columns} rows={rows} rowsCount={20} minHeight={150} />;
}

export default GridData;
