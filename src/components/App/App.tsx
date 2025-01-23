import React, { Suspense, FC } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { routes, ErrorPage } from '../../routes';

import Spinner from '../Common/Spinner';

import './App.css';

const App: FC = () => {
	const router = createBrowserRouter(routes);

	return (
		<ErrorBoundary FallbackComponent={ErrorPage}>
			<Suspense fallback={<Spinner />}>
				<RouterProvider router={router} />
			</Suspense>
		</ErrorBoundary>
	);
};

export default App;
