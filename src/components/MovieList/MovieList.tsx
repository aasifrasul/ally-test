import React, { useRef, useCallback } from 'react';
import { MovieListProps } from '../../types/movieList';

import useImageLazyLoadIO from '../../hooks/useImageLazyLoadIO';
import useInfiniteScrollIO from '../../hooks/useInfiniteScrollIO';
import { createActionHooks } from '../../hooks/createActionHooks';

import { InputText } from '../Common/InputText';
import ScrollToTop from '../Common/ScrollToTopButton';
import { Movie } from './Movie';

import styles from './MovieList.module.css';

export const MovieList: React.FC<MovieListProps> = ({ data, fetchNextPage, schema }) => {
	const observerRef = useRef<HTMLDivElement>(null);
	const { searchActions } = createActionHooks(schema);
	const { filterByText } = searchActions();

	useInfiniteScrollIO(observerRef.current, fetchNextPage);
	useImageLazyLoadIO('img[data-src]', data?.length);

	const handleChange = useCallback(
		(searchedText: string) => {
			filterByText({ filterText: searchedText?.trim() });
		},
		[schema],
	);

	if (!data?.length) {
		return <div>No movies found</div>;
	}

	return (
		<div className="movie-list">
			<div className="search-container">
				<InputText
					label="Search Movie:"
					name="movieSearch"
					id="movieSearch"
					placeholder="Search a Movie"
					onChange={handleChange}
					debounceMs={300}
				/>
			</div>
			<ScrollToTop />
			<div className="movies-grid">
				<div className={styles.container} id="container">
					{data.map((item) => (
						<Movie key={item.id} item={item} styles={styles} />
					))}
				</div>
			</div>
			<div ref={observerRef} className="loading-indicator">
				{data.page !== data.total_pages && 'Loading...'}
			</div>
		</div>
	);
};
