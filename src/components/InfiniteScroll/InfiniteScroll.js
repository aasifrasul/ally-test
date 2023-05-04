import React, { useState, useEffect, useRef, useReducer, useCallback } from 'react';

import useFetch from '../../hooks/useFetch';
import useImageLazyLoadIO from '../../hooks/useImageLazyLoadIO';
import ScrollToTop from '../Common/ScrollToTopButton/ScrollToTop';

import pageReducer from '../../reducers/pageReducer';

import { FetchStoreProvider } from '../../Context/dataFetchContext';

import UserCard from './UserCard';

import { constants } from '../../utils/Constants';
import styles from './InfiniteScroll.css';

const { TOTAL_PAGES, BASE_URL, schema, queryParams } = constants?.infiniteScroll;

const DisplayList = (props) => {
	const [pagerObject, pagerDispatch] = useReducer(pageReducer, { [schema]: { pageNum: 1 } });
	const { state, errorMessage, updateQueryParams } = useFetch(schema, BASE_URL, queryParams);
	const [observerElement, setObserverElement] = useState(null);

	queryParams.page = pagerObject[schema]?.pageNum || 0;

	const observer = useRef(
		new IntersectionObserver((entries) =>
			entries.forEach(
				(entry) =>
					entry.intersectionRatio > 0 &&
					pagerDispatch({ schema, type: 'ADVANCE_PAGE' }),
			),
		),
	);

	useEffect(() => {
		updateQueryParams(queryParams);
	}, [queryParams.page]);

	useEffect(() => {
		observerElement && observer.current.observe(observerElement);
		return () => observerElement && observer.current.unobserve(observerElement);
	}, [observerElement]);

	useImageLazyLoadIO('img[data-src]', state?.data?.results?.length);

	return (
		<div className={styles.scrollParent}>
			{/*<div className={`${styles.topElement} ${styles.uni}`}></div>*/}
			<h1 className="text-3xl text-center mt-4 mb-10">All users</h1>
			<ScrollToTop />
			<div className={styles.scrollArea}>
				{state?.data?.results?.map((user, i) => (
					<>
						{Math.floor(state.data.results.length / 1.2) === i ? (
							<div
								ref={setObserverElement}
								key={`${user.name?.first}-${i}-observer`}
							>
								Loading...
							</div>
						) : null}
						<UserCard data={user} key={`${user.name?.first}-${i}`} />
					</>
				))}
			</div>
			{state?.isLoading && <p className="text-center">isLoading...</p>}
			{queryParams.page - 1 === TOTAL_PAGES && <p className="text-center my-10">♥</p>}
		</div>
	);
};

const InfiniteScroll = (props) => (
	<FetchStoreProvider>
		<DisplayList {...props} />
	</FetchStoreProvider>
);

export default InfiniteScroll;
