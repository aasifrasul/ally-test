import React from 'react';

import { fetchData, getList } from '../../actions/dataSources/nestedCategories';

import NestedCategories from './NestedCategories';

import ConnectDataFetch from '../../HOCs/ConnectDataFetch';

function NestedCategoriesContainer(props) {
	React.useEffect(() => {
		const cleanUp = fetchData();
		return () => cleanUp();
	}, []);

	return <NestedCategories {...props} />;
}

const mapStateToProps = () => {
	return { ...getList() };
};

const mapDispatchToProps = {};

export default ConnectDataFetch(
	mapStateToProps,
	mapDispatchToProps,
)(NestedCategoriesContainer);
