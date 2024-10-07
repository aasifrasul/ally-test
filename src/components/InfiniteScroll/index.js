import { useEffect } from 'react';

import InfiniteScroll from './InfiniteScroll';
import usefetch from '../../hooks/useFetch';

function InfiniteScrollContainer(props) {
	const { cleanUpTopLevel, getList, fetchData, fetchNextPage } = usefetch('infiniteScroll');
	const result = getList();

	useEffect(() => {
		fetchData();
		return () => cleanUpTopLevel();
	}, []);

	return <InfiniteScroll {...props} fetchNextPage={fetchNextPage} {...result} />;
}

export default InfiniteScrollContainer;
