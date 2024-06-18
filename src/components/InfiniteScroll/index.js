import React from 'react';

import {
	fetchInfiniteScrollData,
	fetchInfiniteScrollNextPage,
	getInfiniteScrollList,
} from '../../actions/dataSources/infiniteScroll';

import InfiniteScroll from './InfiniteScroll';

import ConnectDataFetch from '../../HOCs/ConnectDataFetch';

function InfiniteScrollContainer(props) {
	React.useEffect(() => {
		const cleanUp = fetchInfiniteScrollData();
		return () => cleanUp();
	}, []);

	return <InfiniteScroll {...props} />;
}

const mapStateToProps = () => {
	return { ...getInfiniteScrollList() };
};

const mapDispatchToProps = {
	fetchNextPage: fetchInfiniteScrollNextPage,
};

export default ConnectDataFetch(mapStateToProps, mapDispatchToProps)(InfiniteScrollContainer);
