import React from 'react';

import {
	fetchMovieListData,
	fetchMovieListNextPage,
	getMovieListList,
} from '../../actions/dataSources/movieList';

import MovieList from './MovieList';

import ConnectDataFetch from '../../HOCs/ConnectDataFetch';

function MovieListContainer(props) {
	React.useEffect(() => {
		const cleanUp = fetchMovieListData();
		return () => cleanUp();
	}, []);

	return <MovieList {...props} />;
}

const mapStateToProps = () => {
	return { ...getMovieListList() };
};

const mapDispatchToProps = {
	fetchMovieListNextPage,
};

export default ConnectDataFetch(mapStateToProps, mapDispatchToProps)(MovieListContainer);
