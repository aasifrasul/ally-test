import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import { FetchStoreProvider } from './Context/dataFetchContext';

import store from './store';

import App from './components/App/App';

import './index.css';

const root = createRoot(document.querySelector('#root'));
root.render(
	<StrictMode>
		<Provider store={store}>
			<FetchStoreProvider>
				<App />
			</FetchStoreProvider>
		</Provider>
	</StrictMode>,
);
