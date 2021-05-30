import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import regeneratorRuntime from 'regenerator-runtime';

const Home = lazy(() => import(/* webpackChunkName: "Home" */ '../Home/Home'));
const WineConnoisseur = lazy(() =>
	import(/* webpackChunkName: "WineConnoisseur" */ '../WineConnoisseur/WineConnoisseur')
);
const Profile = lazy(() => import(/* webpackChunkName: "Profile" */ '../Profile/Profile'));
const Todos = lazy(() => import(/* webpackChunkName: "Todos" */ '../Todos/Todos'));
const NestedCategories = lazy(() =>
	import(/* webpackChunkName: "NestedCategories" */ '../NestedCategories/NestedCategories')
);
const Stopwatch = lazy(() => import(/* webpackChunkName: "Stopwatch" */ '../Stopwatch/Stopwatch'));
const CurrencyStream = lazy(() => import(/* webpackChunkName: "CurrencyStream" */ '../CurrencyStream/CurrencyStream'));
const MovieList = lazy(() => import(/* webpackChunkName: "MovieList" */ '../MovieList/MovieList'));
const TicTacToe = lazy(() => import(/* webpackChunkName: "TicTacToe" */ '../TicTacToe/TicTacToe'));
const Modal = lazy(() => import(/* webpackChunkName: "Modal" */ '../Common/Modal/Modal'));

import ErrorBoundary from '../Common/ErrorBoundary/ErrorBoundary';

import styles from './App.css';

function App(props) {
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

	return (
		<Suspense fallback={<h1>Loading App...</h1>}>
			<ErrorBoundary>
				<Router>
					<Switch>
						<Route exact path="/" component={() => <Home />} />
						<Route exact path="/TicTacToe" component={() => <TicTacToe />} />
						<Route exact path="/WineConnoisseur" component={() => <WineConnoisseur />} />
						<Route exact path="/Profile" component={() => <Profile />} />
						<Route exact path="/NestedCategories" component={() => <NestedCategories />} />
						<Route exact path="/Todos" component={() => <Todos />} />
						<Route exact path="/Stopwatch" component={() => <Stopwatch />} />
						<Route exact path="/CurrencyStream" component={() => <CurrencyStream />} />
						<Route exact path="/MovieList" component={() => <MovieList />} />
					</Switch>
				</Router>
				<button onClick={handleShow}>Show modal</button>
				{modal}
			</ErrorBoundary>
		</Suspense>
	);
}

export default App;
