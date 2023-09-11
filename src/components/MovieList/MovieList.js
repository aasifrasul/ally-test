import React, { useEffect, useState, useReducer } from 'react';

import useFetch from '../../hooks/useFetch';
import useImageLazyLoadIO from '../../hooks/useImageLazyLoadIO';
import useInfiniteScrollIO from '../../hooks/useInfiniteScrollIO';

import pageReducer from '../../reducers/pageReducer';
import {
	useFetchStore,
	FetchStoreProvider,
	useFetchDispatch,
} from '../../Context/dataFetchContext';

import InputText from '../Common/InputText';
import ScrollToTop from '../Common/ScrollToTopButton/ScrollToTop';

import { constants } from '../../utils/Constants';
import Movie from './Movie.js';

import styles from './MovieList.css';

const { BASE_URL, schema, queryParams } = constants?.movieList;

function DisplayList() {
	const [pagerObject, pagerDispatch] = useReducer(pageReducer, { [schema]: { pageNum: 1 } });
	const [observerElement, setObserverElement] = useState(null);
	const dispatch = useFetchDispatch();
	const state = useFetchStore();
	const { fetchData } = useFetch(schema);

	const items = state[schema]?.data?.results || [];
	queryParams.page = pagerObject[schema]?.pageNum || 0;

	useEffect(() => {
		const cleanUp = fetchData(BASE_URL, queryParams);
		return () => cleanUp();
	}, [queryParams.page]);

	useInfiniteScrollIO(observerElement?.current, () =>
		pagerDispatch({ schema, type: 'ADVANCE_PAGE' })
	);

	useImageLazyLoadIO('img[data-src]', items.length);

	function handleChange(searchedText) {
		observerElement.current = null;
		dispatch({
			schema,
			type: 'FILTER_BY_TEXT',
			payload: { filterText: searchedText?.trim() },
		});
	}

	return (
		<div>
			<div>
				<InputText
					label="Search Item:"
					name="movieSearch"
					id="movieSearch"
					placeholder="Search a Movie"
					callback={handleChange}
					isCallbackDebounced={true}
					debounceDelay={300}
				/>
			</div>
			<ScrollToTop />
			<div>
				<div className={styles.container} id="container">
					{items.map((item, i) => (
						<>
							<Movie key={item?.id} item={item} styles={styles} />
						</>
					))}
				</div>
			</div>
			<div ref={setObserverElement}>Loading...</div>
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
