import React, { useEffect, useRef, useReducer } from 'react';
import DataGrid from '../Common/DataGrid/DataGrid';
import ScrollToTop from '../Common/ScrollToTopButton/ScrollToTop';

import useFetch from '../../hooks/useFetch';
import useInfiniteScrollIO from '../../hooks/useInfiniteScrollIO';

import pageReducer from '../../reducers/pageReducer';
import { FetchStoreProvider, useFetchDispatch } from '../../Context/dataFetchContext';

import styles from './WineConnoisseur.css';

import { constants } from '../../utils/Constants';

const { baseURL, schema, queryParams } = constants?.wineConnoisseur;

function DisplayList(props) {
	const [pagerObject, pagerDispatch] = useReducer(pageReducer, { [schema]: { pageNum: 0 } });
	const ioObserverRef = useRef(null);
	queryParams.page = pagerObject[schema]?.pageNum || 0;

	const { state, fetchData } = useFetch(schema);
	const { headers = [], pageData = [] } = state?.data || {};

	useEffect(() => {
		const abortFetch = fetchData(baseURL, queryParams);
		return () => abortFetch();
	}, [queryParams.page]);

	useInfiniteScrollIO(ioObserverRef.current, () =>
		pagerDispatch({ schema, type: 'ADVANCE_PAGE' })
	);

	return (
		<div className={styles.alignCenter}>
			<span>Wine Connoisseur</span>
			<ScrollToTop />
			<DataGrid headings={headers} rows={pageData} rowsCount={40} minHeight={1000} />
			<div ref={ioObserverRef}>Loading...</div>
		</div>
	);
}

const WineConnoisseur = (props) => (
	<FetchStoreProvider>
		<DisplayList {...props} />
	</FetchStoreProvider>
);

export default WineConnoisseur;
