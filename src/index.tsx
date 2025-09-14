import { StrictMode, FC } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { ApolloProvider } from '@apollo/client';

import { FetchStoreProvider } from './Context/dataFetchContext';
import { ThemeProvider } from './Context/ThemeProvider';

import store from './store';
import { client } from './ApolloClient';

import App from './components/App';
import ErrorBoundary from './components/ErrorBoundary';

import './index.css';

const rootElement = document.querySelector('#root');

if (!rootElement) {
	throw new Error('Failed to find the root element');
}

const root = createRoot(rootElement);

// Create a render function that wraps the entire app with providers
const renderApp = (AppComponent: FC) => {
	root.render(
		<StrictMode>
			<ThemeProvider>
				<Provider store={store}>
					<ApolloProvider client={client}>
						<FetchStoreProvider>
							<ErrorBoundary>
								<AppComponent />
							</ErrorBoundary>
						</FetchStoreProvider>
					</ApolloProvider>
				</Provider>
			</ThemeProvider>
		</StrictMode>,
	);
};

// Initial render
renderApp(App);

// Hot Module Replacement setup
if (module.hot) {
	// Accept updates for the App component - this is the main one that matters
	module.hot.accept('./components/App', () => {
		console.log('🔥 HMR: App component updated');

		try {
			// With React Fast Refresh, we don't need to manually clear cache
			// Just re-import and render
			const { default: NextApp } = require('./components/App');
			renderApp(NextApp);
		} catch (error) {
			console.error('❌ HMR: Failed to update App component:', error);
			// Let React Fast Refresh handle the error, don't force reload
		}
	});

	// For store updates, we need to be more careful to preserve state
	module.hot.accept('./store', () => {
		console.log('🏪 HMR: Store updated - Full reload recommended for Redux changes');
		// For Redux store changes, full reload is usually safer
		// to avoid state inconsistencies
		window.location.reload();
	});

	// Apollo Client changes usually require full reload
	module.hot.accept('./ApolloClient', () => {
		console.log('🚀 HMR: Apollo Client updated - Reloading page');
		window.location.reload();
	});

	// Context providers - let React Fast Refresh handle these
	module.hot.accept(['./Context/dataFetchContext', './Context/ThemeProvider'], () => {
		console.log('🎭 HMR: Context providers updated');
		// React Fast Refresh should handle context updates automatically
		// Only manually re-render if needed
	});

	// Status handler for debugging
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

	// Error handler - be less aggressive about reloading
	module.hot.addErrorHandler((err) => {
		console.error('❌ HMR Error:', err);
		// Don't automatically reload, let React Fast Refresh handle it
	});
}

// Development debugging
console.log('🚀 Development mode enabled');

// Log HMR status
if (module.hot) {
	console.log('🔥 Hot Module Replacement enabled');

	// Add debugging helper
	window.__DEV_HMR_STATUS__ = () => {
		console.log('HMR Status:', module.hot?.status());
	};
} else {
	console.warn('⚠️ HMR not available');
}
