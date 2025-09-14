import React from 'react';
import styles from './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
	state = { hasError: false, error: undefined };

	static getDerivedStateFromError(error) {
		return { hasError: true, error: error };
	}

	componentDidCatch(error, info) {
		console.log(info.componentStack);
	}

	render() {
		const { hasError, error } = this.state;
		const { children, fallback } = this.props;
		return hasError
			? fallback || (
					<div>
						<div>Something went wrong </div>
						<div>{`${error}`} </div>
						<div className={styles.displayError}>
							{' '}
							{JSON.stringify(error.errorData)}{' '}
						</div>
					</div>
				)
			: children;
	}
}

export default ErrorBoundary;
