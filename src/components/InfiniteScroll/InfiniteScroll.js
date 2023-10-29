import React, { useState, useEffect, useRef } from 'react';

import useImageLazyLoadIO from '../../hooks/useImageLazyLoadIO';
import ScrollToTop from '../Common/ScrollToTopButton/ScrollToTop';

import ConnectDataFetch from '../../HOCs/ConnectDataFetch';

import UserCard from './UserCard';

import { constants } from '../../utils/Constants';
import styles from './InfiniteScroll.css';

const { TOTAL_PAGES, BASE_URL, schema, queryParams } = constants?.infiniteScroll;

const InfiniteScroll = ({ data, isLoading, currentPage, fetchNextPage, fetchData }) => {
	const [observerElement, setObserverElement] = useState(null);

	const observer = useRef(false);

	queryParams.page = currentPage;

	const items = data?.results || [];

	useEffect(() => {
		const abortFetch = fetchData(BASE_URL, queryParams);
		return () => abortFetch();
	}, [queryParams.page]);

	useEffect(() => {
		observer.current = new IntersectionObserver((entries) =>
			entries.forEach((entry) => entry.intersectionRatio > 0 && fetchNextPage()),
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

InfiniteScroll.schema = schema;

export default ConnectDataFetch(InfiniteScroll);
