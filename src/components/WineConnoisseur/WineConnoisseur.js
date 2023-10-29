import React, { useEffect, useRef, useReducer } from 'react';
import DataGrid from '../Common/DataGrid/DataGrid';
import ScrollToTop from '../Common/ScrollToTopButton/ScrollToTop';

import useInfiniteScrollIO from '../../hooks/useInfiniteScrollIO';

import ConnectDataFetch from '../../HOCs/ConnectDataFetch';

import styles from './WineConnoisseur.css';

import { constants } from '../../utils/Constants';

const { baseURL, schema, queryParams } = constants?.wineConnoisseur;

function WineConnoisseur({ data, currentPage, fetchNextPage, fetchData }) {
	const ioObserverRef = useRef(null);
	queryParams.page = currentPage;

	const { headers = [], pageData = [] } = data;

	useEffect(() => {
		const abortFetch = fetchData(baseURL, queryParams);
		return () => abortFetch();
	}, [queryParams.page]);

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

export default ConnectDataFetch(WineConnoisseur);
