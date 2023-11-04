import React from 'react';

import ProductList from './ProudctList';

import Pagination from '../Common/Pagination';
import FormGenerator from '../Common/FormGenerator';
import { constants } from '../../utils/Constants';

import { deepCopy } from '../../utils/common';

import useFetchData from '../../hooks/useFetchData';

import { sortMixedArray, searchTextOnData } from '../../utils/common';

import styles from './styles.css';

const API_URL = 'https://lobster-app-ddwng.ondigitalocean.app/product/add_new';
const API_KEY = 'Z9Q7WKEY7ORGBUFGN3EG1QS5Y7FG8DU29GHKKSZH';
const API_URL_PRODUCT_LIST = 'https://lobster-app-ddwng.ondigitalocean.app/product/list';

const headers = {
	'Content-Type': 'application/json',
	api_key: API_KEY,
};

export default function SearchForm() {
	const [displayData, setDisplayData] = React.useState([]);
	const pageNum = React.useRef(1);

	const { data, error, fetchData } = useFetchData();

	React.useEffect(() => {
		setDisplayData(data?.message);
	}, [data?.message]);

	React.useEffect(() => {
		const abortFetch = fetchData(API_URL_PRODUCT_LIST, {
			method: 'GET',
			headers,
		});

		return () => abortFetch();
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();
		const formData = new FormData(e.target);
		const jsonFormData = Object.fromEntries(formData.entries());

		try {
			const res = await fetch(API_URL, {
				method: 'POST',
				mode: 'cors',
				headers,
				body: JSON.stringify(jsonFormData),
			});
			console.log(res);
			clearForm(e.target);
		} catch (err) {
			console.log(err);
		}
	};

	const clearForm = (form) => {
		Array.from(form).forEach((item) => {
			if (item.value) {
				item.value = '';
			}
		});
	};

	const searchCallback = (searchText, id) => {
		const filteredData = searchTextOnData(searchText, data?.message, [
			'product_name',
			'description',
		]);
		pageNum.current = 1;
		setDisplayData(filteredData);
	};

	const paginationCallback = (pageCount) => {
		pageNum.current = pageCount;
		setDisplayData(() => [...displayData]);
	};

	const sortCallback = (header, isAsc) => {
		const sortedData = sortMixedArray(displayData, isAsc, header);
		setDisplayData([...sortedData]);
	};

	const getCurrentPageData = (items = []) => {
		const currentData = items?.length ? items : displayData;
		return currentData?.slice((pageNum.current - 1) * 10, pageNum.current * 10);
	};

	return (
		<div className={styles['App']}>
			<FormGenerator {...deepCopy(constants?.FormMetaData)} onSubmit={handleSubmit} />
			{displayData?.length ? (
				<>
					<ProductList
						data={getCurrentPageData()}
						callback={searchCallback}
						sortCallback={sortCallback}
					/>
					<hr />
					<Pagination
						totalRowCount={displayData?.length}
						pageSize={10}
						callback={paginationCallback}
					/>
				</>
			) : null}
		</div>
	);
}
