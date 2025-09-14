import { useEffect } from 'react';

import { constants } from '../../constants';

import SearchForm from './SearchForm';
import { useSchemaQuery } from '../../hooks/dataSelector';
import { Schema } from '../../constants/types';

const { PRODUCT_LIST, ADD_ITEM_URL } = constants.dataSources!.searchForm;

export default function SearchFormContainer() {
	const addItem = async (data: any) => {
		if (ADD_ITEM_URL) {
			updateData({
				url: ADD_ITEM_URL,
				body: JSON.stringify(data),
			});
		} else {
			console.error('ADD_ITEM_URL is undefined');
		}
	};

	const { data, fetchData, updateData } = useSchemaQuery(Schema.SEARCH_FORM);

	useEffect(() => {
		fetchData({ url: PRODUCT_LIST });
	}, [fetchData]);

	return <SearchForm data={data} addItem={addItem} />;
}
