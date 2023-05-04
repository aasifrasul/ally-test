import React, { useState, useEffect, useRef } from 'react';
import socketClient from 'socket.io-client';

import styles from './OSStatistics.css';

const socket = socketClient.connect('http://localhost:3100');

function OSStatistics(props) {
	const [data, setData] = useState({});
	const { model, speed, times } = data || {};
	const { user, nice, sys, idle, irq } = times || {};
	const didMount = useRef(false);
	socket.on('oSStatsData', (res) => {
		didMount.current && setData(res[0]);
	});

	useEffect(() => {
		if (!didMount.current) {
			didMount.current = true;
		}

		return () => {
			didMount.current = false;
		};
	});

	const handler = () => (e) => socket.emit('fetchOSStats');
	return (
		<div>
			OS Statistics:
			<div>{model}</div>
			<div>{speed}</div>
			<div>
				user: {user}, nice: {nice}, sys: {sys}, idle: {idle}, irq: {irq}
			</div>
			<div>
				<button className={styles.button} type="button" onClick={handler()}>
					Submit
				</button>
			</div>
		</div>
	);
}

export default OSStatistics;
