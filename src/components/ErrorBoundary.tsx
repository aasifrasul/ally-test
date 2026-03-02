import React from 'react';

import { createLogger, LogLevel, Logger } from '../utils/Logger';

const logger: Logger = createLogger('storeFactory', {
	level: LogLevel.DEBUG,
});

type ErrorBoundaryState = {
	hasError: boolean;
	error: Error | null;
};

type ErrorBoundaryProps = {
	children: React.ReactNode;
	fallback?: React.ReactNode | ((error: Error) => React.ReactNode);
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		logger.error('ErrorBoundary caught an error', error, errorInfo);
	}

	render(): React.ReactNode {
		if (this.state.hasError && this.state.error) {
			const { fallback } = this.props;
			if (typeof fallback === 'function') {
				return fallback(this.state.error);
			}
			return fallback ?? <div>Something went wrong.</div>;
		}
		return this.props.children;
	}
}
