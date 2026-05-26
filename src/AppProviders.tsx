import { StrictMode } from 'react';
import { Provider } from 'react-redux';
import { ApolloProvider } from '@apollo/client';

import App from './components/App';

import { FetchStoreProvider } from './Context/dataFetchContext';
import { ThemeProvider } from './Context/ThemeProvider';
import { AuthProvider } from './Context/AuthProvider';

import ToastProvider from './components/Common/toast/ToastProvider';
import { ErrorBoundary } from './components/ErrorBoundary';

import store from './store';
import { client } from './ApolloClient';

const AppProviders = () => {
	return (
		<StrictMode>
			<ErrorBoundary fallback={<div>Critical error. Please refresh the page.</div>}>
				<ThemeProvider>
					<Provider store={store}>
						<ApolloProvider client={client}>
							<FetchStoreProvider>
								<AuthProvider>
									<ToastProvider>
										<App />
									</ToastProvider>
								</AuthProvider>
							</FetchStoreProvider>
						</ApolloProvider>
					</Provider>
				</ThemeProvider>
			</ErrorBoundary>
		</StrictMode>
	);
};

export default AppProviders;
