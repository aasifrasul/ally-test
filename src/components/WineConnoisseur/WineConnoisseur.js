import React, { useEffect, useRef } from 'react';
import DataGrid from '../Common/DataGrid/DataGrid';
import ScrollToTop from '../Common/ScrollToTopButton/ScrollToTop';

import useInfiniteScrollIO from '../../hooks/useInfiniteScrollIO';

import ConnectDataFetch from '../../HOCs/ConnectDataFetch';

import styles from './WineConnoisseur.css';

const schema = 'wineConnoisseur';

function WineConnoisseur({ data, fetchNextPage, fetchData }) {
	const ioObserverRef = useRef(null);

	const { headers = [], pageData = [] } = data;

	useEffect(() => {
		const abortFetch = fetchData();
		return () => abortFetch();
	}, []);

	useInfiniteScrollIO(ioObserverRef.current, fetchNextPage);

	return (
		<div className={styles.alignCenter}>
			<span>Wine Connoisseur</span>
			<ScrollToTop />
			<DataGrid headings={headers} rows={pageData} rowsCount={40} minHeight={1000} />
			<div ref={ioObserverRef}>Loading...</div>
		</div>
	);
}

WineConnoisseur.schema = schema;

export default ConnectDataFetch(null, null)(WineConnoisseur);
