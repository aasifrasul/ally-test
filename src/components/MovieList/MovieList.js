import React, { useEffect, useState, useReducer } from 'react';

import useImageLazyLoadIO from '../../hooks/useImageLazyLoadIO';
import useInfiniteScrollIO from '../../hooks/useInfiniteScrollIO';
import ConnectDataFetch from '../../HOCs/ConnectDataFetch';

import InputText from '../Common/InputText';
import ScrollToTop from '../Common/ScrollToTopButton/ScrollToTop';

import { constants } from '../../utils/Constants';
import Movie from './Movie.js';

import styles from './MovieList.css';

const { BASE_URL, schema, queryParams } = constants?.movieList;

const MovieList = ({ data, currentPage, fetchNextPage, fetchData }) => {
	const [observerElement, setObserverElement] = useState(null);

	queryParams.page = currentPage;

	const items = data?.results || [];

	useEffect(() => {
		const cleanUp = fetchData(BASE_URL, queryParams);
		return () => cleanUp();
	}, [queryParams.page]);

	useInfiniteScrollIO(observerElement?.current, () => fetchNextPage());

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

MovieList.schema = schema;

export default ConnectDataFetch(MovieList);
