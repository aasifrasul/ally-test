import { Suspense, FC } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import { routes } from '../../routes';
import { Spinner, SpinnerPlacement } from '../Common/Spinner';
import { configureGlobalLogger, LogLevel } from '../../utils/Logger';

import './App.css';
import { GlobalLoader } from '../Common/GlobalLoader';

// Configure global logger options at application startup
configureGlobalLogger({
	level: LogLevel.DEBUG,
	enabled: process.env.NODE_ENV !== 'production',
});

const router = createBrowserRouter(routes);

const App: FC = () => (
	<Suspense fallback={<Spinner placement={SpinnerPlacement.FULLSCREEN} size={100} />}>
		<GlobalLoader />
		<RouterProvider router={router} />
	</Suspense>
);

export default App;
