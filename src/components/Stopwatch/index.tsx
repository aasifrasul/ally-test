import React from 'react';
import useTimer from '../../hooks/useTimer';
import { safelyExecuteFunction } from '../../utils/typeChecking';

interface StopwatchProps {}

const Stopwatch: React.FC<StopwatchProps> = (props) => {
	const { seconds, fraction, handleResume, handleStop, handleReset } = useTimer(100);

	return (
		<div>
			{seconds} {fraction}
			<button onClick={() => safelyExecuteFunction(handleStop)}>Stop</button>
			<button onClick={() => safelyExecuteFunction(handleResume)}>Resume</button>
			<button onClick={() => safelyExecuteFunction(handleReset)}>Reset</button>
		</div>
	);
};

export default Stopwatch;
