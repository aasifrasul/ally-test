import React from 'react';

import ProductList from './ProudctList';

import Pagination from '../Common/Pagination';
import FormGenerator, { FormWithElements } from '../Common/FormGenerator';
import { constants } from '../../constants';

import { sortMixedArray, searchTextOnData } from '../../utils/common';

import styles from './styles.module.css';

interface SearchFormProps {
	data: any;
	addItem: (data: any) => void;
}

interface SortCallback {
	(header: string, isAsc: boolean): void;
}

export default function SearchForm({ data, addItem }: SearchFormProps) {
	const [displayData, setDisplayData] = React.useState<any[]>([]);
	const pageNum = React.useRef(1);

	React.useEffect(() => {
		if (data?.message) {
			setDisplayData(data.message);
		}
		return () => setDisplayData([]);
	}, [data?.message?.length]);

	const handleSubmit = (e: React.FormEvent<FormWithElements>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const jsonFormData = Object.fromEntries(formData.entries());
		addItem(jsonFormData);
		clearForm(e.currentTarget);
	};

	const clearForm = (form: FormWithElements) => {
		Array.from(form.elements).forEach((item) => {
			const inputElement = item as HTMLInputElement;
			if (inputElement.value) {
				inputElement.value = '';
			}
		});
	};

	const searchCallback = (searchText: string): void => {
		const filteredData = searchTextOnData(searchText, data?.message, [
			'product_name',
			'description',
		]);
		pageNum.current = 1;
		setDisplayData(filteredData);
	};

	const paginationCallback = (pageCount: number) => {
		pageNum.current = pageCount;
		setDisplayData(() => [...displayData]);
	};

	const sortCallback: SortCallback = (header, isAsc) => {
		const sortedData = sortMixedArray(displayData, isAsc, header);
		setDisplayData([...sortedData]);
	};

	const getCurrentPageData = (items = []) => {
		const currentData = items?.length ? items : displayData;
		return currentData?.slice((pageNum.current - 1) * 10, pageNum.current * 10);
	};

	return (
		<div className={styles['App']}>
			<FormGenerator
				{...constants?.FormMetaData}
				id="form-generator"
				onSubmit={handleSubmit}
			/>
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
						onPageChange={paginationCallback}
					/>
				</>
			) : null}
		</div>
	);
}
