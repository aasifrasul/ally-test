import React from 'react';

import { constants } from '../../constants';

import SearchForm from './SearchForm';
import useFetch, { FetchResult } from '../../hooks/useFetch';
import { InitialState, Schema } from '../../constants/types';

const { PRODUCT_LIST, ADD_ITEM_URL } = constants.dataSources!.searchForm;

export default function SearchFormContainer() {
	const [data, setData] = React.useState([]);
	const { fetchData, updateData }: FetchResult<InitialState, InitialState> = useFetch(
		Schema.SEARCH_FORM,
		{ onSuccess },
	);

	function onSuccess({ message }: { message: unknown[] }) {
		setData(message);
	}

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

	React.useEffect(() => {
		const fetchInitialData = async () => {
			if (PRODUCT_LIST) {
				fetchData({ url: PRODUCT_LIST });
			} else {
				console.error('PRODUCT_LIST is undefined');
			}
		};

		fetchInitialData();
	}, []);

	return <SearchForm data={data} addItem={addItem} />;
}
