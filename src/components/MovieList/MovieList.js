import React, { useState, useEffect, useRef, useReducer } from 'react';

import useFetch from '../../hooks/useFetch';
import useImageLazyLoadIO from '../../hooks/useImageLazyLoadIO';
import useInfiniteScrollIO from '../../hooks/useInfiniteScrollIO';

import pageReducer from '../../reducers/pageReducer';
import { FetchStoreProvider, useFetchDispatch } from '../../Context/dataFetchContext';

import InputText from '../Common/InputText';
import ScrollToTop from '../Common/ScrollToTopButton/ScrollToTop';

import { constants } from '../../utils/Constants';
import Movie from './Movie.js';

import { debounce } from '../../utils/throttleAndDebounce';

import styles from './MovieList.css';

const { BASE_URL, schema, queryParams } = constants?.movieList;

function DisplayList() {
	const [pagerObject, pagerDispatch] = useReducer(pageReducer, { [schema]: { pageNum: 1 } });
	const ioObserverRef = useRef(null);
	const searchRef = useRef('');
	const dispatch = useFetchDispatch();
	const debouncedHandleChange = debounce(handleChange, 400);

	const { state, errorMessage, updateQueryParams } = useFetch(schema, BASE_URL, queryParams);

	const rowsCount = state?.data?.results?.length;
	queryParams.page = pagerObject[schema]?.pageNum || 0;

	useEffect(() => updateQueryParams(queryParams), [queryParams.page]);

	useInfiniteScrollIO(ioObserverRef, () => pagerDispatch({ schema, type: 'ADVANCE_PAGE' }));
	useImageLazyLoadIO('img[data-src]', rowsCount);

	function handleChange(e) {
		ioObserverRef.current = null;
		dispatch({
			schema,
			type: 'FILTER_BY_TEXT',
			payload: { filterText: searchRef.current?.trim() },
		});
	}

	return (
		<div>
			<div>
				<InputText
					label="Search Item:"
					inputTextRef={searchRef}
					onChangeCallback={debouncedHandleChange}
				/>
			</div>
			{state?.isLoading && <p className="text-center">isLoading...</p>}
			<ScrollToTop />
			<div>
				<div className={styles.container} id="container">
					{state?.data?.results?.map((item, i) => (
						<Movie key={item?.id} item={item} styles={styles} />
					))}
				</div>
			</div>
			<div ref={ioObserverRef}>Loading...</div>
		</div>
	);
}

const MovieList = (props) => {
	return (
		<FetchStoreProvider>
			<DisplayList />
		</FetchStoreProvider>
	);
};

export default MovieList;
