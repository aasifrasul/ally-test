import { hot } from 'react-hot-loader/root';
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { ApolloProvider } from '@apollo/client';

import { FetchStoreProvider } from './Context/dataFetchContext';

import store from './store';
import { client } from './apolloClient';

import App from './components/App/App';

import './index.css';

// Extend the NodeModule interface to include the hot property
declare const module: {
	hot?: {
		accept: (path: string, callback: () => void) => void;
	};
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');
const root = createRoot(rootElement);

const render = (AppComponent: typeof App) => {
	root.render(
		<StrictMode>
			<Provider store={store}>
				<ApolloProvider client={client}>
					<FetchStoreProvider>
						<AppComponent />
					</FetchStoreProvider>
				</ApolloProvider>
			</Provider>
		</StrictMode>,
	);
};

render(App);

if (module.hot) {
	module.hot.accept('./components/App/App', () => {
		const NextApp = require('./components/App/App').default;
		render(NextApp);
	});

	module.hot.accept('./index.css', () => {
		// Force a reload to apply the updated CSS
		window.location.reload();
	});
}
