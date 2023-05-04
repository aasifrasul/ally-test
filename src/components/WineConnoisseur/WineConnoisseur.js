import React, { useEffect, useRef, useReducer } from 'react';
import DataGrid from '../Common/DataGrid/DataGrid';

import useFetch from '../../hooks/useFetch';
import useInfiniteScrollIO from '../../hooks/useInfiniteScrollIO';

import pageReducer from '../../reducers/pageReducer';
import { FetchStoreProvider, useFetchDispatch } from '../../Context/dataFetchContext';

import css from './WineConnoisseur.css';

const styles = css?.locals;

import { constants } from '../../utils/Constants';

const { baseURL, schema, queryParams } = constants?.wineConnoisseur;

function DisplayList(props) {
	const [pagerObject, pagerDispatch] = useReducer(pageReducer, { [schema]: { pageNum: 0 } });
	const ioObserverRef = useRef(null);
	const pageNum = pagerObject[schema]?.pageNum || 0;

	queryParams.page = pageNum || 0;

	const { state, errorMessage, updateQueryParams } = useFetch(schema, baseURL, queryParams);
	const { headers = [], pageData = [] } = state?.data || {};

	useEffect(() => updateQueryParams(queryParams), [pageNum]);

	useInfiniteScrollIO(ioObserverRef, () => pagerDispatch({ schema, type: 'ADVANCE_PAGE' }));

	return (
		<div className={styles.alignCenter}>
			<span>Wine Connoisseur</span>
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
