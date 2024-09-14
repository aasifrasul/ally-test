import React from 'react';

import { fetchData, fetchNextPage, getList } from '../../actions/dataSources/movieList';

import MovieList from './MovieList';

import ConnectDataFetch from '../../HOCs/ConnectDataFetch';

function MovieListContainer(props) {
	React.useEffect(() => {
		const cleanUp = fetchData();
		return () => cleanUp();
	}, []);

	return <MovieList {...props} />;
}

const mapStateToProps = () => {
	return { ...getList() };
};

const mapDispatchToProps = {
	fetchNextPage,
};

export default ConnectDataFetch(mapStateToProps, mapDispatchToProps)(MovieListContainer);
