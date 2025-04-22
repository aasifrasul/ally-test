import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ReturnType {
	count: number;
	timestamps: DOMHighResTimeStamp[];
	reasons: string[];
	recordRenderReason: (reason: string) => void;
}

// Custom hook for tracking renders
export const useRenderCounter = (
	componentName: string = 'Component',
	verbose: boolean = true,
): ReturnType => {
	const renderCount = useRef<number>(0);
	const renderTimestamps = useRef<DOMHighResTimeStamp[]>([]);
	const renderReasons = useRef<string[]>([]);

	// Get the time elapsed since the last render
	const getTimeSinceLastRender = () => {
		const timestamps = renderTimestamps.current;
		if (timestamps.length < 2) return 0;
		return timestamps[timestamps.length - 1] - timestamps[timestamps.length - 2];
	};

	// Log the render information
	useEffect(() => {
		renderCount.current += 1;
		renderTimestamps.current.push(performance.now());

		if (verbose) {
			console.group(`${componentName} render #${renderCount.current}`);
			console.log(`Time: ${new Date().toLocaleTimeString()}`);

			if (renderCount.current > 1) {
				console.log(
					`Time since last render: ${getTimeSinceLastRender().toFixed(2)}ms`,
				);
				console.log(
					`Possible reason: ${renderReasons.current[renderReasons.current.length - 1] || 'Unknown'}`,
				);
			}

			console.groupEnd();
		}
	});

	// Method to record a reason for the next render
	const recordRenderReason = useCallback((reason: string) => {
		renderReasons.current.push(reason);
	}, []);

	// Return render count and helper methods
	return {
		count: renderCount.current,
		timestamps: renderTimestamps.current,
		reasons: renderReasons.current,
		recordRenderReason,
	};
};
