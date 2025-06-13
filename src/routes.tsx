import React, { lazy, ReactElement } from 'react';

import { constants } from './constants';

import Header from './components/Common/Header';

interface RouteConfig {
	path: string;
	element: ReactElement;
	meta?: {
		requiresAuth?: boolean;
		title?: string;
		// ... other metadata
	};
	errorElement?: ReactElement;
}

export const ErrorPage = lazy(
	() => import(/* webpackChunkName: "ErrorPage" */ './components/Common/ErrorPage'),
);

const landingPages = constants.routes!.reduce<
	Record<string, React.LazyExoticComponent<React.ComponentType<any>>>
>((acc, name) => {
	acc[name] = lazy(() => import(/* webpackChunkName: "[request]" */ `./components/${name}`));
	return acc;
}, {});

const Home = landingPages.Home;
delete landingPages.Home;

export const routes: RouteConfig[] = [
	{
		path: '/',
		element: <Home pages={landingPages} />,
		errorElement: <ErrorPage />,
		meta: {
			title: 'Home',
		},
	},
	...Object.entries(landingPages).map(([name, Component]) => ({
		path: `/${name}`,
		element: (
			<Header>
				<Component {...(Component as any).props} />
			</Header>
		),
		errorElement: <ErrorPage />,
		meta: {
			title: name,
		},
	})),
];
