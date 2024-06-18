import React from 'react';

import {
	fetchWineConnoisseurData,
	fetchWineConnoisseurNextPage,
	getWineConnoisseurList,
} from '../../actions/dataSources/wineConnoisseur';

import WineConnoisseur from './WineConnoisseur';

import ConnectDataFetch from '../../HOCs/ConnectDataFetch';

function WineConnoisseurContainer(props) {
	React.useEffect(() => {
		const cleanUp = fetchWineConnoisseurData();
		return () => cleanUp();
	}, []);

	return <WineConnoisseur {...props} />;
}

const mapStateToProps = () => {
	return { ...getWineConnoisseurList() };
};

const mapDispatchToProps = {
	fetchNextPage: fetchWineConnoisseurNextPage,
};

export default ConnectDataFetch(mapStateToProps, mapDispatchToProps)(WineConnoisseurContainer);
