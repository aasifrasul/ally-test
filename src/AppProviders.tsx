import { StrictMode, type ComponentType, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { ApolloProvider, type ApolloClient } from '@apollo/client';
import type { Store } from 'redux';

export interface AppProvidersConfig {
	store?: Store;
	client?: ApolloClient<any> | undefined;
	app?: ComponentType;
	children?: ReactNode;
}

function resolveAppComponent(app?: ComponentType): ComponentType {
	if (app) {
		return app;
	}

	const { default: App } = require('./components/App') as { default: ComponentType };
	return App;
}

function resolveStoreInstance(store?: Store): Store {
	if (store) {
		return store;
	}

	return require('./store').default as Store;
}

function resolveApolloClient(client?: ApolloClient<any>): ApolloClient<any> | undefined {
	if (client) {
		return client;
	}

	return require('./ApolloClient').client as ApolloClient<any> | undefined;
}

export function createAppProviders(config: AppProvidersConfig = {}) {
	const {
		store: storeInstance = resolveStoreInstance(config.store),
		client: apolloClient = resolveApolloClient(config.client),
		app: AppComponent = resolveAppComponent(config.app),
		children,
	} = config;

	const { FetchStoreProvider } = require('./Context/dataFetchContext') as {
		FetchStoreProvider: React.ComponentType<{ children?: ReactNode }>;
	};
	const { ThemeProvider } = require('./Context/ThemeProvider') as {
		ThemeProvider: React.ComponentType<{ children?: ReactNode }>;
	};
	const { AuthProvider } = require('./Context/AuthProvider') as {
		AuthProvider: React.ComponentType<{ children?: ReactNode }>;
	};
	const ToastProvider = require('./components/Common/toast/ToastProvider')
		.default as React.ComponentType<{
		children?: ReactNode;
	}>;
	const { ErrorBoundary } = require('./components/ErrorBoundary') as {
		ErrorBoundary: React.ComponentType<{ children?: ReactNode; fallback?: ReactNode }>;
	};

	const AppProviderTree = ({ children: innerChildren }: { children?: ReactNode } = {}) => {
		const content = innerChildren ?? children ?? <AppComponent />;
		const providerContent = apolloClient ? (
			<ApolloProvider client={apolloClient}>
				<FetchStoreProvider>
					<AuthProvider>
						<ToastProvider>{content}</ToastProvider>
					</AuthProvider>
				</FetchStoreProvider>
			</ApolloProvider>
		) : (
			<FetchStoreProvider>
				<AuthProvider>
					<ToastProvider>{content}</ToastProvider>
				</AuthProvider>
			</FetchStoreProvider>
		);

		return (
			<StrictMode>
				<ErrorBoundary fallback={<div>Critical error. Please refresh the page.</div>}>
					<ThemeProvider>
						<Provider store={storeInstance}>{providerContent}</Provider>
					</ThemeProvider>
				</ErrorBoundary>
			</StrictMode>
		);
	};

	return AppProviderTree;
}

const AppProviders = createAppProviders();

export default AppProviders;
