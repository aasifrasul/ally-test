import React, { lazy } from 'react';

import { constants } from './constants';

import Header from './components/Common/Header';

interface RouteConfig {
	path: string;
	element: React.ReactElement;
	meta?: {
		requiresAuth?: boolean;
		title?: string;
		// ... other metadata
	};
	errorElement?: React.ReactElement;
}

interface LandingPages {
	[key: string]: React.LazyExoticComponent<React.ComponentType<any>>;
}

interface ComponentProps {
	pages: LandingPages;
}

// Lazy imports
export const ErrorPage = lazy(
	() => import(/* webpackChunkName: "ErrorPage" */ './components/Common/ErrorPage'),
);
const Home = lazy(() => import(/* webpackChunkName: "Home" */ './components/Home'));
const ReactQuery = lazy(
	() => import(/* webpackChunkName: "ReactQuery" */ './components/ReactQuery'),
);
const KeyBoardShortcutPage = lazy(
	() =>
		import(
			/* webpackChunkName: "KeyBoardShortcutPage" */ './components/KeyBoardShortcutPage/KeyBoardShortcutPage'
		),
);
const WineConnoisseur = lazy(
	() => import(/* webpackChunkName: "WineConnoisseur" */ './components/WineConnoisseur'),
);
const Todos = lazy(() => import(/* webpackChunkName: "Todos" */ './components/Todos'));
const NestedCategories = lazy(
	() => import(/* webpackChunkName: "NestedCategories" */ './components/NestedCategories'),
);
const Stopwatch = lazy(
	() => import(/* webpackChunkName: "Stopwatch" */ './components/stopwatch'),
);
const CurrencyStream = lazy(
	() => import(/* webpackChunkName: "CurrencyStream" */ './components/CurrencyStream'),
);
const MovieList = lazy(
	() => import(/* webpackChunkName: "MovieList" */ './components/MovieList'),
);
const TicTacToe = lazy(
	() => import(/* webpackChunkName: "TicTacToe" */ './components/TicTacToe/TicTacToe'),
);
const InfiniteScroll = lazy(
	() => import(/* webpackChunkName: "InfiniteScroll" */ './components/InfiniteScroll'),
);
const AutoComplete = lazy(
	() => import(/* webpackChunkName: "AutoComplete" */ './components/AutoComplete'),
);
const NewsFeed = lazy(
	() => import(/* webpackChunkName: "NewsFeed" */ './components/NewsFeed'),
);
const FlipTheCard = lazy(
	() => import(/* webpackChunkName: "FlipTheCard" */ './components/FlipTheCard'),
);
const TabsComponent = lazy(
	() => import(/* webpackChunkName: "TabsComponent" */ './components/TabsComponent'),
);
const TrafficLight = lazy(
	() => import(/* webpackChunkName: "TrafficLight" */ './components/TrafficLight'),
);
const DeeplyNestedCategories = lazy(
	() =>
		import(
			/* webpackChunkName: "DeeplyNestedCategories" */ './components/DeeplyNestedCategories'
		),
);
const AsyncArticles = lazy(
	() => import(/* webpackChunkName: "AsyncArticles" */ './components/AsyncArticles'),
);
const DigitalClock = lazy(
	() => import(/* webpackChunkName: "DigitalClock" */ './components/DigitalClock'),
);
const AccordionDemo = lazy(
	() => import(/* webpackChunkName: "AccordionDemo" */ './components/AccordionDemo'),
);
const SearchForm = lazy(
	() => import(/* webpackChunkName: "SearchForm" */ './components/SearchForm'),
);
const ListExchange = lazy(
	() => import(/* webpackChunkName: "ListExchange" */ './components/ListExchange'),
);
const SortUsers = lazy(
	() => import(/* webpackChunkName: "SortUsers" */ './components/SortUsers'),
);

const ProgressBar = lazy(
	() => import(/* webpackChunkName: "ProgressBar" */ './components/ProgressBar'),
);
const Dashboard = lazy(
	() => import(/* webpackChunkName: "Dashboard" */ './components/Dashboard'),
);
const DisplayGraphql = lazy(
	() => import(/* webpackChunkName: "DisplayGraphql" */ './components/DisplayGraphql'),
);
const Comments = lazy(
	() => import(/* webpackChunkName: "Comments" */ './components/Comments'),
);
const GraphqlSubscription = lazy(
	() =>
		import(
			/* webpackChunkName: "GraphqlSubscription" */ './components/GraphqlSubscription'
		),
);
const UsersGraphql = lazy(
	() => import(/* webpackChunkName: "UsersGraphql" */ './components/UsersGraphql'),
);
const ChatBot = lazy(() => import(/* webpackChunkName: "ChatBot" */ './components/ChatBot'));
const TodoGroups = lazy(
	() => import(/* webpackChunkName: "TodoGroups" */ './components/TodoGroups'),
);
const BookStore = lazy(
	() => import(/* webpackChunkName: "BookStore" */ './components/BookStore'),
);

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
	TodoGroups,
	BookStore,
};

(AutoComplete as any).props = {
	suggestions: constants?.autoComplete?.initialFeed,
};

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
