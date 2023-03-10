import React, { useState, useEffect, useRef } from 'react';

function useInterval(callback, delay = 0) {
	const callbackRef = useRef();

	// Remember the latest callback.
	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	// Set up the interval.
	useEffect(() => {
		const tick = () => callbackRef.current();
		const id = setInterval(tick, delay);
		return () => clearInterval(id);
	}, [delay]);
}

export default useInterval;
