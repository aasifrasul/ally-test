import React, { FC } from 'react';
import { Provider } from 'react-redux';
import { ApolloProvider } from '@apollo/client';

import { FetchStoreProvider } from './Context/dataFetchContext';
import { ThemeProvider } from './Context/ThemeProvider';
import { AuthProvider } from './Context/AuthProvider';
import ToastProvider from './components/Common/toast/ToastProvider';

import store from './store';
import { client } from './ApolloClient';

const AppProviders: FC<{ children: React.ReactNode }> = ({ children }) => {
	return (
		<ThemeProvider>
			<Provider store={store}>
				<ApolloProvider client={client}>
					<FetchStoreProvider>
						<AuthProvider>
							<ToastProvider>{children}</ToastProvider>
						</AuthProvider>
					</FetchStoreProvider>
				</ApolloProvider>
			</Provider>
		</ThemeProvider>
	);
};

export default AppProviders;
