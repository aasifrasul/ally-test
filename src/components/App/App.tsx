import React, { Suspense, lazy, FC } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import regeneratorRuntime from 'regenerator-runtime';

import Header from '../Common/Header/Header';
import Spinner from '../Common/Spinner';
import { constants } from '../../constants';
import './App.css';

interface ComponentProps {
	[key: string]: any;
}

interface LandingPages {
	[key: string]: React.LazyExoticComponent<React.ComponentType<any>>;
}

// Lazy imports
const Home = lazy(() => import(/* webpackChunkName: "Home" */ '../Home/Home'));
const ReactQuery = lazy(
	() => import(/* webpackChunkName: "ReactQuery" */ '../ReactQuery/ReactQuery'),
);
const KeyBoardShortcutPage = lazy(
	() =>
		import(
			/* webpackChunkName: "KeyBoardShortcutPage" */ '../KeyBoardShortcutPage/KeyBoardShortcutPage'
		),
);
const WineConnoisseur = lazy(
	() => import(/* webpackChunkName: "WineConnoisseur" */ '../WineConnoisseur'),
);
const Todos = lazy(() => import(/* webpackChunkName: "Todos" */ '../Todos'));
const NestedCategories = lazy(
	() => import(/* webpackChunkName: "NestedCategories" */ '../NestedCategories'),
);
const Stopwatch = lazy(
	() => import(/* webpackChunkName: "Stopwatch" */ '../stopwatch/stopwatch'),
);
const CurrencyStream = lazy(
	() => import(/* webpackChunkName: "CurrencyStream" */ '../CurrencyStream/CurrencyStream'),
);
const MovieList = lazy(() => import(/* webpackChunkName: "MovieList" */ '../MovieList'));
const TicTacToe = lazy(
	() => import(/* webpackChunkName: "TicTacToe" */ '../TicTacToe/TicTacToe'),
);
const InfiniteScroll = lazy(
	() => import(/* webpackChunkName: "InfiniteScroll" */ '../InfiniteScroll'),
);
const AutoComplete = lazy(
	() => import(/* webpackChunkName: "AutoComplete" */ '../AutoComplete/AutoComplete'),
);
const NewsFeed = lazy(() => import(/* webpackChunkName: "NewsFeed" */ '../NewsFeed'));
const FlipTheCard = lazy(() => import(/* webpackChunkName: "FlipTheCard" */ '../FlipTheCard'));
const TabsComponent = lazy(
	() => import(/* webpackChunkName: "TabsComponent" */ '../TabsComponent'),
);
const TrafficLight = lazy(
	() => import(/* webpackChunkName: "TrafficLight" */ '../TrafficLight'),
);
const DeeplyNestedCategories = lazy(
	() => import(/* webpackChunkName: "DeeplyNestedCategories" */ '../DeeplyNestedCategories'),
);
const AsyncArticles = lazy(
	() => import(/* webpackChunkName: "AsyncArticles" */ '../AsyncArticles'),
);
const DigitalClock = lazy(
	() => import(/* webpackChunkName: "DigitalClock" */ '../DigitalClock'),
);
const AccordionDemo = lazy(
	() => import(/* webpackChunkName: "AccordionDemo" */ '../AccordionDemo'),
);
const SearchForm = lazy(() => import(/* webpackChunkName: "SearchForm" */ '../SearchForm'));
const ListExchange = lazy(
	() => import(/* webpackChunkName: "ListExchange" */ '../ListExchange'),
);
const SortUsers = lazy(() => import(/* webpackChunkName: "SortUsers" */ '../SortUsers'));
const ErrorPage = lazy(
	() => import(/* webpackChunkName: "ErrorPage" */ '../Common/ErrorPage'),
);
const ProgressBar = lazy(() => import(/* webpackChunkName: "ProgressBar" */ '../ProgressBar'));
const Dashboard = lazy(() => import(/* webpackChunkName: "Dashboard" */ '../Dashboard'));
const DisplayGraphql = lazy(
	() => import(/* webpackChunkName: "DisplayGraphql" */ '../DisplayGraphql'),
);
const Comments = lazy(() => import(/* webpackChunkName: "Comments" */ '../Comments'));
const GraphqlSubscription = lazy(
	() => import(/* webpackChunkName: "GraphqlSubscription" */ '../GraphqlSubscription'),
);
const UsersGraphql = lazy(
	() => import(/* webpackChunkName: "UsersGraphql" */ '../UsersGraphql'),
);
const ChatBot = lazy(() => import(/* webpackChunkName: "ChatBot" */ '../ChatBot'));

const landingPages: LandingPages = {
	Todos,
	Stopwatch,
	TicTacToe,
	ReactQuery,
	KeyBoardShortcutPage,
	WineConnoisseur,
	NestedCategories,
	CurrencyStream,
	MovieList,
	InfiniteScroll,
	AutoComplete,
	NewsFeed,
	FlipTheCard,
	TabsComponent,
	TrafficLight,
	DigitalClock,
	AccordionDemo,
	ProgressBar,
	DisplayGraphql,
	DeeplyNestedCategories,
	AsyncArticles,
	Dashboard,
	Comments,
	SearchForm,
	ListExchange,
	SortUsers,
	GraphqlSubscription,
	UsersGraphql,
	ChatBot,
};

(AutoComplete as any).props = {
	suggestions: constants?.autoComplete?.initialFeed,
};

const App: FC = () => {
	const routesArray = [
		{
			path: '/',
			element: <Home pages={landingPages} />,
			errorElement: <ErrorPage />,
		},
		...Object.entries(landingPages).map(([name, Component]) => ({
			path: `/${name}`,
			element: (
				<Header>
					<Component {...(Component as any).props} />
				</Header>
			),
			errorElement: <ErrorPage />,
		})),
	];

	const router = createBrowserRouter(routesArray);

	return (
		<Suspense fallback={<Spinner />}>
			<RouterProvider router={router} />
		</Suspense>
	);
};

export default App;
