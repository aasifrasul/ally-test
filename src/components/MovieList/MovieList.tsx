import React, { useRef, useCallback } from 'react';
import { InitialState } from '../../constants/types';
import { MovieListProps } from '../../types/movieList';

import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { createActionHooks } from '../../hooks/createActionHooks';

import { InputText } from '../Common/InputText';
import ScrollToTop from '../Common/ScrollToTopButton';
import { Movie } from './Movie';

import * as styles from './MovieList.module.css';

type Props = Omit<InitialState, 'data'> & MovieListProps;

export const MovieList = (props: Props): React.ReactNode => {
	const { data, fetchNextPage, schema, TOTAL_PAGES, currentPage } = props;
	const observerRef = useRef<HTMLDivElement>(null);
	const { searchActions } = createActionHooks(schema);
	const { filterByText } = searchActions();

	useInfiniteScroll({
		scrollRef: observerRef,
		callback: () => fetchNextPage(currentPage! + 1),
	});

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
					{data?.map((item) => <Movie key={item.id} item={item} styles={styles} />)}
				</div>
			</div>
			<div ref={observerRef} className="loading-indicator">
				{currentPage !== TOTAL_PAGES && 'Loading...'}
			</div>
		</div>
	);
};
