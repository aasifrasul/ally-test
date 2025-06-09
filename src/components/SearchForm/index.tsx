import React from 'react';

import { constants } from '../../constants';

import SearchForm from './SearchForm';
import useFetch, { FetchResult } from '../../hooks/useFetch';
import { InitialState, Schema } from '../../constants/types';
import { handleAsyncCalls } from '../../utils/common';

const { PRODUCT_LIST, ADD_ITEM_URL } = constants.dataSources!.searchForm;

export default function SearchFormContainer() {
	const [data, setData] = React.useState<any>(null);
	const { fetchData }: FetchResult<InitialState, InitialState> = useFetch(
		Schema.SEARCH_FORM,
	);

	const addItem = async (data: any) => {
		if (ADD_ITEM_URL) {
			const result = await handleAsyncCalls(
				fetchData({
					url: ADD_ITEM_URL,
					body: JSON.stringify(data),
				}),
			);
			if (!result.success) {
				console.error('Failed to add item:', result.error);
			} else {
				console.log('Item added:', data);
			}
		} else {
			console.error('ADD_ITEM_URL is undefined');
		}
	};

	React.useEffect(() => {
		const fetchInitialData = async () => {
			if (PRODUCT_LIST) {
				const result = await handleAsyncCalls(fetchData({ url: PRODUCT_LIST }));
				if (!result.success) {
					console.error('Failed to fetch:', result.error);
				} else {
					const { data } = result;
					setData(data);
					console.log('data:', data);
				}
			} else {
				console.error('PRODUCT_LIST is undefined');
			}
		};

		fetchInitialData();
	}, []);

	return <SearchForm data={data?.message} addItem={addItem} />;
}
