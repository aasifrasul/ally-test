import React from 'react';

import { InputText } from '../Common/InputText';
import Table from '../Common/Table';

interface ProductListProps {
	data: any[];
	callback?: (text: string, id: string) => void;
	sortCallback?: (key: string, isAsc: boolean) => void;
	searchText: string;
}

const headers = [
	{ key: 'product_name', value: 'Product Name' },
	{ key: 'original_price', value: 'Original Price' },
	{ key: 'sale_price', value: 'Sale Price' },
	{ key: 'product_type', value: 'Product Type' },
	{ key: 'description', value: 'Description' },
	{ key: 'date_n_time', value: 'Date And Time' },
];

export default function ProductList({
	data,
	callback,
	sortCallback,
	searchText,
}: ProductListProps) {
	const handleSearch = (text: string) => {
		if (typeof callback === 'function') {
			callback(text, 'product_name');
		}
	};

	return (
		<>
			<div>
				<span>All Products</span>
				<span>
					<InputText
						id="product_search"
						name="product_search"
						placeholder="Search Data"
						onChange={handleSearch}
						debounceMs={300}
						initialValue={searchText}
					/>
				</span>
			</div>
			<hr />
			<Table
				headers={headers}
				rowData={data}
				keyIdentifier="id"
				tableWidth="100%"
				sortCallback={sortCallback}
			/>
		</>
	);
}
