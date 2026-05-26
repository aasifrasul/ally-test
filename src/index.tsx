import { createRoot } from 'react-dom/client';
import AppProviders from './AppProviders';
import './index.css';

const rootElement = document.querySelector('#root');

if (!rootElement) {
	throw new Error('Failed to find the root element');
}

const root = createRoot(rootElement);

const renderApp = () => {
	root.render(<AppProviders />);
};

// Initial render
renderApp();

// Hot Module Replacement setup
if (module.hot) {
	module.hot.accept('./components/App', () => {
		console.log('🔥 HMR: App component updated');

		try {
			renderApp();
		} catch (error) {
			console.error('❌ HMR: Failed to update App component:', error);
		}
	});

	module.hot.accept('./store', () => {
		console.log('🏪 HMR: Store updated - Full reload recommended for Redux changes');
		window.location.reload();
	});

	module.hot.accept('./ApolloClient', () => {
		console.log('🚀 HMR: Apollo Client updated - Reloading page');
		window.location.reload();
	});

	module.hot.accept(['./Context/dataFetchContext', './Context/ThemeProvider'], () => {
		console.log('🎭 HMR: Context providers updated');
	});

	module.hot.addStatusHandler((status) => {
		switch (status) {
			case 'idle':
				console.log('✅ HMR: Ready');
				break;
			case 'check':
				console.log('🔍 HMR: Checking for updates...');
				break;
			case 'prepare':
				console.log('⚙️ HMR: Preparing updates...');
				break;
			case 'ready':
				console.log('📦 HMR: Updates ready');
				break;
			case 'dispose':
				console.log('🗑️ HMR: Disposing modules...');
				break;
			case 'apply':
				console.log('⚡ HMR: Applying updates...');
				break;
			case 'abort':
			case 'fail':
				console.error('❌ HMR: Update failed');
				break;
		}
	});

	module.hot.addErrorHandler((err) => {
		console.error('❌ HMR Error:', err);
	});
}

console.log('🚀 Development mode enabled');

if (module.hot) {
	console.log('🔥 Hot Module Replacement enabled');

	window.__DEV_HMR_STATUS__ = () => {
		console.log('HMR Status:', module.hot?.status());
	};
} else {
	console.warn('⚠️ HMR not available');
}

window.addEventListener('error', (e) => {
	console.error('Uncaught error:', e.error);
	e.preventDefault();
});

window.addEventListener('unhandledrejection', (e) => {
	console.error('Unhandled rejection:', e.reason);
	e.preventDefault();
});
