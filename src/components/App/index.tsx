import { Suspense, FC } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import { routes } from '../../routes';
import { Spinner } from '../Common/Spinner';
import { configureGlobalLogger, LogLevel } from '../../utils/Logger';

import './App.css';

// Configure global logger options at application startup
configureGlobalLogger({
	level: LogLevel.DEBUG,
	enabled: process.env.NODE_ENV !== 'production',
});

const router = createBrowserRouter(routes);

const App: FC = () => {
	return (
		<Suspense fallback={<Spinner />}>
			<RouterProvider router={router} />
		</Suspense>
	);
};

export default App;
