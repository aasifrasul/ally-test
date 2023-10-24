import React, { useEffect, useState, useReducer } from 'react';

import useFetch from '../../hooks/useFetch';
import useImageLazyLoadIO from '../../hooks/useImageLazyLoadIO';
import useInfiniteScrollIO from '../../hooks/useInfiniteScrollIO';

import pageReducer from '../../reducers/pageReducer';
import { useFetchStore, FetchStoreProvider } from '../../Context/dataFetchContext';

import InputText from '../Common/InputText';
import ScrollToTop from '../Common/ScrollToTopButton/ScrollToTop';

import { constants } from '../../utils/Constants';
import Movie from './Movie.js';

import styles from './MovieList.css';

const { BASE_URL, schema, queryParams } = constants?.movieList;

const DisplayList = ({ items, pageNum, nextPage, fetchData }) => {
	const [observerElement, setObserverElement] = useState(null);

	queryParams.page = pageNum;

	useEffect(() => {
		const cleanUp = fetchData(BASE_URL, queryParams);
		return () => cleanUp();
	}, [queryParams.page]);

	useInfiniteScrollIO(observerElement?.current, () => nextPage());

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
};

const MovieList = (props) => {
	const { store, dispatch } = useFetchStore();
	const state = store.getState();
	const { isLoading, data } = state[schema];
	const items = data?.results || [];

	const { fetchData } = useFetch(schema, dispatch);

	const [pagerObject, pagerDispatch] = useReducer(pageReducer, { [schema]: { pageNum: 0 } });
	const pageNum = pagerObject[schema]?.pageNum || 0;
	const nextPage = () => pagerDispatch({ schema, type: 'ADVANCE_PAGE' });

	const combinedProps = {
		...props,
		items,
		isLoading,
		pageNum,
		nextPage,
		fetchData,
	};

	return <DisplayList {...combinedProps} />;
};

const MovieListContainer = (props) => {
	return (
		<FetchStoreProvider>
			<MovieList {...props} />
		</FetchStoreProvider>
	);
};

export default MovieListContainer;
