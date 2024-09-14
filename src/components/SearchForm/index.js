import React from 'react';

import { fetchData, getList, addItem } from '../../actions/dataSources/searchForm';

import SearchForm from './SearchForm';

import ConnectDataFetch from '../../HOCs/ConnectDataFetch';

function SearchFormContainer(props) {
	React.useEffect(() => {
		const cleanUp = fetchData();
		return () => cleanUp();
	}, []);

	return <SearchForm {...props} />;
}

const mapStateToProps = () => {
	return { ...getList() };
};

const mapDispatchToProps = {
	addItem,
};

export default ConnectDataFetch(mapStateToProps, mapDispatchToProps)(SearchFormContainer);
