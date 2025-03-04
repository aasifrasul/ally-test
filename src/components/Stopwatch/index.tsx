import React from 'react';
import { useTimer } from '../../hooks/useTimer';
import { safelyExecuteFunction } from '../../utils/typeChecking';

interface StopwatchProps {}

const Stopwatch: React.FC<StopwatchProps> = (props) => {
	const { seconds, milliseconds, handleResume, handleStop, handleReset } = useTimer();

	return (
		<div>
			{seconds} {milliseconds}
			<button onClick={() => safelyExecuteFunction(handleStop, null)}>Stop</button>
			<button onClick={() => safelyExecuteFunction(handleResume, null)}>Resume</button>
			<button onClick={() => safelyExecuteFunction(handleReset, null)}>Reset</button>
		</div>
	);
};

export default Stopwatch;
