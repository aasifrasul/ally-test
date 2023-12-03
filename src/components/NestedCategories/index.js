import React from 'react';

import {
	fetchNestedCategoriesData,
	getNestedCategoriesList,
} from '../../actions/dataSources/nestedCategories';

import NestedCategories from './NestedCategories';

import ConnectDataFetch from '../../HOCs/ConnectDataFetch';

function NestedCategoriesContainer(props) {
	React.useEffect(() => {
		const cleanUp = fetchNestedCategoriesData();
		return () => cleanUp();
	}, []);

	return <NestedCategories {...props} />;
}

const mapStateToProps = () => {
	return { ...getNestedCategoriesList() };
};

const mapDispatchToProps = {};

export default ConnectDataFetch(
	mapStateToProps,
	mapDispatchToProps,
)(NestedCategoriesContainer);
