import React from 'react';

import { fetchData, fetchNextPage, getList } from '../../actions/dataSources/infiniteScroll';

import InfiniteScroll from './InfiniteScroll';

import ConnectDataFetch from '../../HOCs/ConnectDataFetch';

function InfiniteScrollContainer(props) {
	React.useEffect(() => {
		const cleanUp = fetchData();
		return () => cleanUp();
	}, []);

	return <InfiniteScroll {...props} />;
}

const mapStateToProps = () => {
	return { ...getList() };
};

const mapDispatchToProps = { fetchNextPage };

export default ConnectDataFetch(mapStateToProps, mapDispatchToProps)(InfiniteScrollContainer);
