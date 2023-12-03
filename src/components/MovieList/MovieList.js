import React, { useEffect, useState } from 'react';

import useImageLazyLoadIO from '../../hooks/useImageLazyLoadIO';
import useInfiniteScrollIO from '../../hooks/useInfiniteScrollIO';

import InputText from '../Common/InputText';
import ScrollToTop from '../Common/ScrollToTopButton/ScrollToTop';

import Movie from './Movie.js';

import styles from './MovieList.css';

const MovieList = ({ data, fetchNextPage }) => {
	const [observerElement, setObserverElement] = useState(null);

	useInfiniteScrollIO(observerElement?.current, fetchNextPage);

	useImageLazyLoadIO('img[data-src]', data?.results?.length);

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
					{data?.results?.map((item, i) => (
						<Movie key={item?.id} item={item} styles={styles} />
					))}
				</div>
			</div>
			<div ref={setObserverElement}>Loading...</div>
		</div>
	);
};

export default MovieList;
