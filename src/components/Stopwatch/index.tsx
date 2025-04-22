import React from 'react';
import { useTimer } from '../../hooks/useTimer';

interface StopwatchProps {}

const Stopwatch: React.FC<StopwatchProps> = (props) => {
	const { seconds, milliseconds, start, stop, reset } = useTimer();

	return (
		<div>
			<div>
				{seconds} {milliseconds}
			</div>
			<div>
				<button onClick={stop}>Stop</button>
				<button onClick={start}>Resume</button>
				<button onClick={reset}>Reset</button>
			</div>
		</div>
	);
};

export default Stopwatch;
