import React, { useState, useEffect, useRef } from 'react';

import useTimer from '../../hooks/useTimer';

import { safelyExecuteFunction } from '../../utils/typeChecking';

function stopwatch(props) {
	const { seconds, fraction, handleResume, handleStop, handleReset } = useTimer(100);

	return (
		<div>
			{seconds} {fraction}
			<button onClick={() => safelyExecuteFunction(handleStop)}>Stop</button>
			<button onClick={() => safelyExecuteFunction(handleResume)}>Resume</button>
			<button onClick={() => safelyExecuteFunction(handleReset)}>Reset</button>
		</div>
	);
}

export default stopwatch;
