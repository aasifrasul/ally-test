import React, { useState, useEffect, useRef, useReducer } from 'react';

import useFetch from '../../hooks/useFetch';
import useImageLazyLoadIO from '../../hooks/useImageLazyLoadIO';
import ScrollToTop from '../Common/ScrollToTopButton/ScrollToTop';

import pageReducer from '../../reducers/pageReducer';

import { useFetchStore, FetchStoreProvider } from '../../Context/dataFetchContext';

import UserCard from './UserCard';

import { constants } from '../../utils/Constants';
import styles from './InfiniteScroll.css';

const { TOTAL_PAGES, BASE_URL, schema, queryParams } = constants?.infiniteScroll;

const DisplayList = ({ items, isLoading, pageNum, nextPage, fetchData }) => {
	const [observerElement, setObserverElement] = useState(null);

	const observer = useRef(false);

	queryParams.page = pageNum;

	useEffect(() => {
		const abortFetch = fetchData(BASE_URL, queryParams);
		return () => abortFetch();
	}, [queryParams.page]);

	useEffect(() => {
		observer.current = new IntersectionObserver((entries) =>
			entries.forEach((entry) => entry.intersectionRatio > 0 && nextPage()),
		);
		observerElement && observer.current.observe(observerElement);
		return () => observerElement && observer.current.unobserve(observerElement);
	}, [observerElement]);

	useImageLazyLoadIO('img[data-src]', items.length);

	return (
		<div className={styles.scrollParent}>
			{/*<div className={`${styles.topElement} ${styles.uni}`}></div>*/}
			<h1 className="text-3xl text-center mt-4 mb-10">All users</h1>
			<ScrollToTop />
			<div className={styles.scrollArea}>
				{items.map((user, i) => (
					<>
						{Math.floor(items.length / 1.2) === i ? (
							<div ref={setObserverElement} key={`${user.email}-obserbver`}>
								Loading...
							</div>
						) : null}
						<UserCard data={user} key={`${user.email}-${i}`} />
					</>
				))}
			</div>
			{isLoading && <p className="text-center">Loading...</p>}
			{queryParams.page - 1 === TOTAL_PAGES && <p className="text-center my-10">♥</p>}
		</div>
	);
};

const InfiniteScroll = (props) => {
	const { store, dispatch } = useFetchStore();
	const state = store.getState();
	const { isLoading, data } = state[schema];
	const items = data?.results || [];

	const { fetchData } = useFetch(schema, dispatch);

	const [pagerObject, pagerDispatch] = useReducer(pageReducer, { [schema]: { pageNum: 0 } });
	const pageNum = pagerObject[schema]?.pageNum || 0;
	const nextPage = () => pagerDispatch({ schema, type: 'ADVANCE_PAGE' });

	const combinedProps = {
		...props,
		items,
		isLoading,
		pageNum,
		nextPage,
		fetchData,
	};

	return <DisplayList {...combinedProps} />;
};

const InfiniteScrollContainer = (props) => {
	return (
		<FetchStoreProvider>
			<InfiniteScroll {...props} />
		</FetchStoreProvider>
	);
};

export default InfiniteScrollContainer;
