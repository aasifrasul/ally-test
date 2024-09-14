import React from 'react';

import { fetchData, fetchNextPage, getList } from '../../actions/dataSources/wineConnoisseur';

import WineConnoisseur from './WineConnoisseur';

import ConnectDataFetch from '../../HOCs/ConnectDataFetch';

function WineConnoisseurContainer(props) {
	React.useEffect(() => {
		const cleanUp = fetchData();
		return () => cleanUp();
	}, []);

	return <WineConnoisseur {...props} />;
}

const mapStateToProps = () => {
	return { ...getList() };
};

const mapDispatchToProps = {
	fetchNextPage: fetchNextPage,
};

export default ConnectDataFetch(mapStateToProps, mapDispatchToProps)(WineConnoisseurContainer);
