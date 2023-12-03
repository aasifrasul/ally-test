import React, { useEffect, useRef } from 'react';
import DataGrid from '../Common/DataGrid/DataGrid';
import ScrollToTop from '../Common/ScrollToTopButton/ScrollToTop';

import useInfiniteScrollIO from '../../hooks/useInfiniteScrollIO';

import styles from './WineConnoisseur.css';

function WineConnoisseur({ data, fetchNextPage, currentPage }) {
	const ioObserverRef = useRef(null);

	const { headers = [], pageData = [] } = data;

	useInfiniteScrollIO(ioObserverRef.current, () => fetchNextPage(currentPage + 1));

	return (
		<div className={styles.alignCenter}>
			<span>Wine Connoisseur</span>
			<ScrollToTop />
			<DataGrid headings={headers} rows={pageData} rowsCount={40} minHeight={1000} />
			<div ref={ioObserverRef}>Loading...</div>
		</div>
	);
}

export default WineConnoisseur;
