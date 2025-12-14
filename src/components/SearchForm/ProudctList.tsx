import React from 'react';

import { InputText } from '../Common/InputText';
import {
	Table,
	TableBody,
	TableCell,
	TableHeader,
	TableHeaderCell,
	TableRow,
} from '../Common/Table';
import { Segment } from '../Common/Segment';
import { safelyExecuteFunction } from '../../utils/typeChecking';

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
	const handleSearch = (text: string) =>
		safelyExecuteFunction(callback, null, text, 'product_name');

	const rows = data.map((item, id) => (
		<TableRow key={id}>
			{headers.map(({ key }) => (
				<TableCell>{item[key]}</TableCell>
			))}
		</TableRow>
	));

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
			<Segment>
				<Table celled striped>
					<TableHeader>
						<TableRow>
							{headers.map(({ value }) => (
								<TableHeaderCell>{value}</TableHeaderCell>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>{rows}</TableBody>
				</Table>
			</Segment>
		</>
	);
}
