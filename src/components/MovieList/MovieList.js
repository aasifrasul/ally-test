import React, { useState, useEffect, useRef, useReducer } from 'react';

import useFetch from '../../hooks/useFetch';
import useImageLazyLoadIO from '../../hooks/useImageLazyLoadIO';
import useInfiniteScrollIO from '../../hooks/useInfiniteScrollIO';

import pageReducer from '../../reducers/pageReducer';
import { FetchStoreProvider, useFetchDispatch } from '../../Context/dataFetchContext';

import InputText from '../Common/InputText';
import ScrollToTop from '../Common/ScrollToTopButton/ScrollToTop';

import Movie from './Movie.js';

import { debounce, throttle } from '../../utils/throttleAndDebounce';

import styles from './MovieList.css';

const BASE_URL = `https://api.themoviedb.org/3/discover/movie`;
const schema = 'movieList';
const queryParams = {
	page: 1,
	sort_by: 'popularity.desc',
	api_key: '04c35731a5ee918f014970082a0088b1',
};

function DisplayList() {
	const [pagerObject, pagerDispatch] = useReducer(pageReducer, { [schema]: { pageNum: 1 } });
	const ioObserverRef = useRef(null);
	const searchRef = useRef('');
	const dispatch = useFetchDispatch();
	const debouncedHandleChange = debounce(handleChange, 400);

	const { state, errorMessage, updateQueryParams } = useFetch(schema, BASE_URL, queryParams);

	const rowsCount = state?.data?.results?.length
	queryParams.page = pagerObject[schema]?.pageNum || 0;

	useEffect(() => {
		updateQueryParams(queryParams);
	}, [queryParams.page]);

	useInfiniteScrollIO(ioObserverRef, () => pagerDispatch({ schema, type: 'ADVANCE_PAGE' }));
	useImageLazyLoadIO('img[data-src]', rowsCount);

	function handleChange(value) {
		value = value.trim();
		searchRef.current = null;
		ioObserverRef.current = null;
		console.log(value);
		dispatch({ schema, type: 'FILTER_BY_TEXT', payload: { filterText: value } });
	}

	return (
		<div>
			<div>
				<InputText
					label="Search Item:"
					defaultValue={searchRef.current}
					inputTextRef={searchRef}
					callback={debouncedHandleChange}
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
