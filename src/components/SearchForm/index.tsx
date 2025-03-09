import React from 'react';

import { constants } from '../../constants';

import SearchForm from './SearchForm';
import { fetchAPIData } from '../../utils/common';

const { PRODUCT_LIST, ADD_ITEM_URL, API_KEY, options, headers } =
	constants.dataSources!.searchForm;

export default function SearchFormContainer() {
	const [data, setData] = React.useState<any>(null);

	const addItem = async (data: any) => {
		if (ADD_ITEM_URL) {
			const result = await fetchAPIData(
				fetch(ADD_ITEM_URL, {
					...options,
					headers,
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
				const result = await fetchAPIData(
					fetch(PRODUCT_LIST, { ...options, headers }),
				);
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
