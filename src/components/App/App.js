import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter as Router, Switch, Route, useHistory } from 'react-router-dom';
import regeneratorRuntime from 'regenerator-runtime';

import Header from '../Common/Header/Header';

const Home = lazy(() => import(/* webpackChunkName: "Home" */ '../Home/Home'));
const ReactQuery = lazy(() => import(/* webpackChunkName: "ReactQuery" */ '../ReactQuery/ReactQuery'));
const KeyBoardShortcutPage = lazy(() =>
	import(/* webpackChunkName: "KeyBoardShortcutPage" */ '../KeyBoardShortcutPage/KeyBoardShortcutPage'),
);
const WineConnoisseur = lazy(() =>
	import(/* webpackChunkName: "WineConnoisseur" */ '../WineConnoisseur/WineConnoisseur'),
);
const Profile = lazy(() => import(/* webpackChunkName: "Profile" */ '../Profile/Profile'));
const Todos = lazy(() => import(/* webpackChunkName: "Todos" */ '../Todos/Todos'));
const NestedCategories = lazy(() =>
	import(/* webpackChunkName: "NestedCategories" */ '../NestedCategories/NestedCategories'),
);
const Stopwatch = lazy(() => import(/* webpackChunkName: "Stopwatch" */ '../stopwatch/stopwatch'));
const CurrencyStream = lazy(() => import(/* webpackChunkName: "CurrencyStream" */ '../CurrencyStream/CurrencyStream'));
const MovieList = lazy(() => import(/* webpackChunkName: "MovieList" */ '../MovieList/MovieList'));
const TicTacToe = lazy(() => import(/* webpackChunkName: "TicTacToe" */ '../TicTacToe/TicTacToe'));
const InfiniteScroll = lazy(() => import(/* webpackChunkName: "InfiniteScroll" */ '../InfiniteScroll/InfiniteScroll'));
const Counter = lazy(() => import(/* webpackChunkName: "Counter" */ '../Counter/Counter'));
const Contacts = lazy(() => import(/* webpackChunkName: "Contacts" */ '../Contacts/view'));

const Modal = lazy(() => import(/* webpackChunkName: "Modal" */ '../Common/Modal/Modal'));

import Spinner from '../Common/Spinner/Spinner';
import ErrorBoundary from '../Common/ErrorBoundary/ErrorBoundary';

import styles from './App.css';

const pages = {
	Counter: Counter,
	Todos: Todos,
	Contacts: Contacts,
	Profile: Profile,
	Stopwatch: Stopwatch,
	TicTacToe: TicTacToe,
	ReactQuery: ReactQuery,
	KeyBoardShortcutPage: KeyBoardShortcutPage,
	WineConnoisseur: WineConnoisseur,
	NestedCategories: NestedCategories,
	CurrencyStream: CurrencyStream,
	MovieList: MovieList,
	InfiniteScroll: InfiniteScroll,
};

function App(props) {
	const history = useHistory();

	const [showModal, setShowModal] = useState(false);

	const modal = showModal ? (
		<Modal>
			<div className={styles.modal}>
				<div className={styles['modal-content']}>
					With a portal, we can render content into a different part of the DOM, as if it were any other React
					child.
				</div>
				This is being rendered inside the #modal-container div.
				<button className={styles.close} onClick={handleHide}>
					Hide modal
				</button>
			</div>
		</Modal>
	) : null;

	const handleShow = () => setShowModal(true);
	const handleHide = () => setShowModal(false);

	const pagesHtml = [];
	for (let name in pages) {
		const Component = pages[name];
		pagesHtml.push(
			<Route
				key={name}
				exact
				path={`/${name}`}
				component={() => (
					<Header>
						<Component />
					</Header>
				)}
			/>,
		);
	}

	return (
		<Suspense fallback={<Spinner />}>
			<ErrorBoundary>
				<Router>
					<Switch>
						<Route exact path="/" component={() => <Home handleShow={handleShow} pages={pages} />} />
						{pagesHtml}
					</Switch>
				</Router>
			</ErrorBoundary>
		</Suspense>
	);
}

export default App;
