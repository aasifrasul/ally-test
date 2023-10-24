import React, { useEffect, useRef, useReducer } from 'react';
import DataGrid from '../Common/DataGrid/DataGrid';
import ScrollToTop from '../Common/ScrollToTopButton/ScrollToTop';

import useFetch from '../../hooks/useFetch';
import useInfiniteScrollIO from '../../hooks/useInfiniteScrollIO';

import pageReducer from '../../reducers/pageReducer';
import { FetchStoreProvider, useFetchStore } from '../../Context/dataFetchContext';

import styles from './WineConnoisseur.css';

import { constants } from '../../utils/Constants';

const { baseURL, schema, queryParams } = constants?.wineConnoisseur;

function DisplayList({ data, pageNum, nextPage, fetchData }) {
	const ioObserverRef = useRef(null);
	queryParams.page = pageNum;

	const { headers = [], pageData = [] } = data;

	useEffect(() => {
		const abortFetch = fetchData(baseURL, queryParams);
		return () => abortFetch();
	}, [queryParams.page]);

	useInfiniteScrollIO(ioObserverRef.current, nextPage);

	return (
		<div className={styles.alignCenter}>
			<span>Wine Connoisseur</span>
			<ScrollToTop />
			<DataGrid headings={headers} rows={pageData} rowsCount={40} minHeight={1000} />
			<div ref={ioObserverRef}>Loading...</div>
		</div>
	);
}

const WineConnoisseur = (props) => {
	const { store, dispatch } = useFetchStore();
	const state = store.getState();
	const [pagerObject, pagerDispatch] = useReducer(pageReducer, { [schema]: { pageNum: 0 } });
	const pageNum = pagerObject[schema]?.pageNum || 0;
	const nextPage = () => pagerDispatch({ schema, type: 'ADVANCE_PAGE' });
	const { fetchData } = useFetch(schema, dispatch);
	const data = state[schema]?.data || {};

	const combinedProps = {
		...props,
		data,
		pageNum,
		nextPage,
		fetchData,
	};

	return <DisplayList {...combinedProps} />;
};

const WineConnoisseurContainer = (props) => (
	<FetchStoreProvider>
		<WineConnoisseur {...props} />
	</FetchStoreProvider>
);

export default WineConnoisseurContainer;
