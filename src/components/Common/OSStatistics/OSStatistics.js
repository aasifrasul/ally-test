import React, { useState, useEffect, useCallback } from 'react';
import socketClient from 'socket.io-client';

import styles from './OSStatistics.css';

const socket = socketClient.connect('http://localhost:3100');

function OSStatistics() {
	const [data, setData] = useState({
		model: '',
		speed: 0,
		times: { user: 0, nice: 0, sys: 0, idle: 0, irq: 0 },
	});

	const { model, speed, times } = data;
	const { user, nice, sys, idle, irq } = times;

	const handleOSStatsData = useCallback((res) => {
		if (res && res[0]) {
			setData(res[0]);
		}
	}, []);

	useEffect(() => {
		socket.on('oSStatsData', handleOSStatsData);

		return () => {
			socket.off('oSStatsData', handleOSStatsData);
		};
	}, [handleOSStatsData]);

	const handleFetchStats = useCallback(() => {
		socket.emit('fetchOSStats');
	}, []);

	return (
		<div className={styles.container}>
			<h2 className={styles.title}>OS Statistics:</h2>
			<div className={styles.stat}>Model: {model}</div>
			<div className={styles.stat}>Speed: {speed} MHz</div>
			<div className={styles.times}>
				<div>User: {user}</div>
				<div>Nice: {nice}</div>
				<div>System: {sys}</div>
				<div>Idle: {idle}</div>
				<div>IRQ: {irq}</div>
			</div>
			<button className={styles.button} type="button" onClick={handleFetchStats}>
				Fetch OS Stats
			</button>
		</div>
	);
}

export default OSStatistics;
