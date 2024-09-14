import React from 'react';

import ProductList from './ProudctList';

import Pagination from '../Common/Pagination';
import FormGenerator from '../Common/FormGenerator';
import { constants } from '../../constants';

import { deepCopy } from '../../utils/common';

import { sortMixedArray, searchTextOnData } from '../../utils/common';

import styles from './styles.css';

export default function SearchForm({ data, addItem }) {
	const [displayData, setDisplayData] = React.useState([]);
	const pageNum = React.useRef(1);

	React.useEffect(() => {
		setDisplayData(data.message);
		return () => setDisplayData([]);
	}, [data?.message?.length]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		const formData = new FormData(e.target);
		const jsonFormData = Object.fromEntries(formData.entries());
		addItem(jsonFormData);
		clearForm(e.target);
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
