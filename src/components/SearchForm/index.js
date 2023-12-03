import React from 'react';

import {
	fetchSearchFormData,
	getSearchFormList,
	addSearchFormItem,
} from '../../actions/dataSources/searchForm';

import SearchForm from './SearchForm';

import ConnectDataFetch from '../../HOCs/ConnectDataFetch';

function SearchFormContainer(props) {
	React.useEffect(() => {
		const cleanUp = fetchSearchFormData();
		return () => cleanUp();
	}, []);

	return <SearchForm {...props} />;
}

const mapStateToProps = () => {
	return { ...getSearchFormList() };
};

const mapDispatchToProps = {
	addSearchFormItem,
};

export default ConnectDataFetch(mapStateToProps, mapDispatchToProps)(SearchFormContainer);
