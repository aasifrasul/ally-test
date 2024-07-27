import React from 'react';

import InputText from '../Common/InputText';
import Table from '../Common/Table';

export default function ProductList({ data, callback, sortCallback }) {
	const handleSearch = (text, id) => callback && callback(text, id);

	return (
		<>
			<div>
				<span>All Products</span>
				<span>
					<InputText
						id="product_search"
						name="product_search"
						placeholder="Search Data"
						callback={handleSearch}
						debounceDelay={300}
					/>
				</span>
			</div>
			<hr />
			<Table
				headers={[
					{ key: 'product_name', value: 'Product Name' },
					{ key: 'original_price', value: 'Original Price' },
					{ key: 'sale_price', value: 'Sale Price' },
					{ key: 'product_type', value: 'Product Type' },
					{ key: 'description', value: 'Description' },
					{ key: 'date_n_time', value: 'Date And Time' },
				]}
				keyIdentifier={'_id'}
				rowData={data}
				sortCallback={sortCallback}
			/>
		</>
	);
}
