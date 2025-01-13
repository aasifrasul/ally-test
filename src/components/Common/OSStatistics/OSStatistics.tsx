import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import styles from './OSStatistics.module.css';

interface Times {
	user: number;
	nice: number;
	sys: number;
	idle: number;
	irq: number;
}

interface OSStatsData {
	model: string;
	speed: number;
	times: Times;
}

// Create socket instance with proper type
const socket: Socket = io('http://localhost:3100');

function OSStatistics(): JSX.Element {
	const [data, setData] = useState<OSStatsData>({
		model: '',
		speed: 0,
		times: { user: 0, nice: 0, sys: 0, idle: 0, irq: 0 },
	});

	const { model, speed, times } = data;
	const { user, nice, sys, idle, irq } = times;

	const handleOSStatsData = useCallback((res: OSStatsData) => {
		if (res) {
			setData(res);
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
