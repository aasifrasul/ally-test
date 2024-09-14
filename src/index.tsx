import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { ApolloProvider } from '@apollo/client';

import { FetchStoreProvider } from './Context/dataFetchContext';

import store from './store';
import { client } from './apolloClient';

import App from './components/App/App';

import './index.css';

const rootElement = document.querySelector('#root');

if (!rootElement) {
	throw new Error('Failed to find the root element');
}

const root = createRoot(rootElement);

root.render(
	<StrictMode>
		<Provider store={store}>
			<ApolloProvider client={client}>
				<FetchStoreProvider>
					<App />
				</FetchStoreProvider>
			</ApolloProvider>
		</Provider>
	</StrictMode>,
);
