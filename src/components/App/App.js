import React, { Suspense, lazy, useState } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import regeneratorRuntime from 'regenerator-runtime';

import Header from '../Common/Header/Header';

const Home = lazy(() => import(/* webpackChunkName: "Home" */ '../Home/Home'));
const ReactQuery = lazy(() =>
	import(/* webpackChunkName: "ReactQuery" */ '../ReactQuery/ReactQuery'),
);
const KeyBoardShortcutPage = lazy(() =>
	import(
		/* webpackChunkName: "KeyBoardShortcutPage" */ '../KeyBoardShortcutPage/KeyBoardShortcutPage'
	),
);
const WineConnoisseur = lazy(() =>
	import(/* webpackChunkName: "WineConnoisseur" */ '../WineConnoisseur/WineConnoisseur'),
);
// const Profile = lazy(() => import(/* webpackChunkName: "Profile" */ '../Profile/Profile'));
const Todos = lazy(() => import(/* webpackChunkName: "Todos" */ '../Todos'));
const NestedCategories = lazy(() =>
	import(/* webpackChunkName: "NestedCategories" */ '../NestedCategories/NestedCategories'),
);
const Stopwatch = lazy(() =>
	import(/* webpackChunkName: "Stopwatch" */ '../stopwatch/stopwatch'),
);
const CurrencyStream = lazy(() =>
	import(/* webpackChunkName: "CurrencyStream" */ '../CurrencyStream/CurrencyStream'),
);
const MovieList = lazy(() =>
	import(/* webpackChunkName: "MovieList" */ '../MovieList/MovieList'),
);
const TicTacToe = lazy(() =>
	import(/* webpackChunkName: "TicTacToe" */ '../TicTacToe/TicTacToe'),
);
const InfiniteScroll = lazy(() =>
	import(/* webpackChunkName: "InfiniteScroll" */ '../InfiniteScroll/InfiniteScroll'),
);
// const Counter = lazy(() => import(/* webpackChunkName: "Counter" */ '../Counter/Counter'));
//const Contacts = lazy(() => import(/* webpackChunkName: "Contacts" */ '../Contacts/Contacts'));
const AutoComplete = lazy(() =>
	import(/* webpackChunkName: "AutoComplete" */ '../AutoComplete/AutoComplete'),
);
const NewsFeed = lazy(() => import(/* webpackChunkName: "NewsFeed" */ '../NewsFeed'));
const FlipTheCard = lazy(() => import(/* webpackChunkName: "FlipTheCard" */ '../FlipTheCard'));
const TabsComponent = lazy(() =>
	import(/* webpackChunkName: "TabsComponent" */ '../TabsComponent'),
);

const TrafficLight = lazy(() =>
	import(/* webpackChunkName: "TrafficLight" */ '../TrafficLight'),
);

const DeeplyNestedCategories = lazy(() =>
	import(/* webpackChunkName: "DeeplyNestedCategories" */ '../DeeplyNestedCategories'),
);

const AsyncArticles = lazy(() =>
	import(/* webpackChunkName: "AsyncArticles" */ '../AsyncArticles'),
);

const DigitalClock = lazy(() =>
	import(/* webpackChunkName: "DigitalClock" */ '../DigitalClock'),
);

const AccordionDemo = lazy(() =>
	import(/* webpackChunkName: "AccordionDemo" */ '../AccordionDemo'),
);

const SearchForm = lazy(() => import(/* webpackChunkName: "SearchForm" */ '../SearchForm'));
const ListExchange = lazy(() =>
	import(/* webpackChunkName: "ListExchange" */ '../ListExchange'),
);
const SortUsers = lazy(() => import(/* webpackChunkName: "SortUsers" */ '../SortUsers'));

const ErrorPage = lazy(() =>
	import(/* webpackChunkName: "ErrorPage" */ '../Common/ErrorPage'),
);

const ProgressBar = lazy(() => import(/* webpackChunkName: "ProgressBar" */ '../ProgressBar'));

const Dashboard = lazy(() => import(/* webpackChunkName: "Dashboard" */ '../Dashboard'));

const Graphql = lazy(() => import(/* webpackChunkName: "Graphql" */ '../Graphql'));
const Comments = lazy(() => import(/* webpackChunkName: "Comments" */ '../Comments'));

import Spinner from '../Common/Spinner/Spinner';
// import ErrorBoundary from '../Common/ErrorBoundary/ErrorBoundary';

import { constants } from '../../utils/Constants';
import styles from './App.css';

AutoComplete.props = {};
AutoComplete.props.suggestions = constants?.autoComplete?.initialFeed;

const pages = {
	//Counter: Counter,
	Todos: Todos,
	//Contacts: Contacts,
	//Profile: Profile,
	Stopwatch: Stopwatch,
	TicTacToe: TicTacToe,
	ReactQuery: ReactQuery,
	KeyBoardShortcutPage: KeyBoardShortcutPage,
	WineConnoisseur: WineConnoisseur,
	NestedCategories: NestedCategories,
	CurrencyStream: CurrencyStream,
	MovieList: MovieList,
	InfiniteScroll: InfiniteScroll,
	AutoComplete: AutoComplete,
	NewsFeed: NewsFeed,
	FlipTheCard: FlipTheCard,
	TabsComponent: TabsComponent,
	TrafficLight: TrafficLight,
	DigitalClock: DigitalClock,
	AccordionDemo: AccordionDemo,
	ProgressBar: ProgressBar,
	Graphql: Graphql,
	DeeplyNestedCategories: DeeplyNestedCategories,
	AsyncArticles: AsyncArticles,
	Dashboard: Dashboard,
	Comments: Comments,
	SearchForm: SearchForm,
	ListExchange: ListExchange,
	SortUsers: SortUsers,
};

const App = (props) => {
	const routesArray = [
		{
			path: '/',
			element: <Home pages={pages} />,
			errorElement: <ErrorPage />,
		},
	];

	for (let name in pages) {
		const Component = pages[name];
		routesArray.push({
			path: `/${name}`,
			element: (
				<Header>
					<Component {...Component.props} />
				</Header>
			),
			errorElement: <ErrorPage />,
		});
	}

	const router = createBrowserRouter(routesArray);

	return (
		<Suspense fallback={<Spinner />}>
			<RouterProvider router={router} />
		</Suspense>
	);
};

export default App;
