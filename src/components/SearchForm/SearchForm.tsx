import React from 'react';

import { useSearchParams } from '../../hooks/useSearchParams';

import ProductList from './ProudctList';
import Pagination from '../Common/Pagination';
import FormGenerator from '../Common/FormGenerator';
import { constants } from '../../constants';
import { Spinner } from '../Common/Spinner';

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
	const [isLoading, setIsLoading] = React.useState(true);
	const { getParamByKey, searchParams, updateParams } = useSearchParams();

	const processData = (newData: any[] | undefined) => {
		let processedData = newData || [];

		const searchText = getParamByKey('searchText');

		// Apply search filter
		if (searchText) {
			processedData = searchTextOnData(searchText, processedData, [
				'product_name',
				'description',
			]);
		}

		// Apply sorting
		const isAsc = getParamByKey('isAsc');
		const sortHeader = getParamByKey('sortHeader') || 'product_name';
		if (processedData.length > 0 && isAsc) {
			processedData = sortMixedArray(processedData, isAsc === 'true', sortHeader);
		}

		setDisplayData(processedData);
		setIsLoading(false);
	};

	React.useEffect(() => {
		['isAsc', 'sortHeader', 'searchText', 'page'].forEach((key) => {
			if (searchParams && !searchParams.has(key)) {
				searchParams.delete(key, '');
			}
		});
		processData(data);
	}, [data, searchParams]);

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const jsonFormData = Object.fromEntries(formData.entries());
		addItem(jsonFormData);
		clearForm(e.currentTarget);
	};

	const clearForm = (form: HTMLFormElement) => {
		Array.from(form.elements).forEach((item) => {
			const inputElement = item as HTMLInputElement;
			if (inputElement.value) {
				inputElement.value = '';
			}
		});
	};

	const searchCallback = (searchText: string): void => {
		updateParams({ page: '1' });
		if (searchText.length === 0) {
			searchParams.delete('searchText');
		} else {
			updateParams({ searchText });
		}
	};

	const sortCallback: SortCallback = (header, isAsc): void =>
		updateParams({ isAsc: isAsc.toString(), sortHeader: header });

	const currentPageData = React.useMemo(() => {
		const pageNum = parseInt(getParamByKey('page') || '1');
		return displayData?.slice((pageNum - 1) * 10, pageNum * 10) || [];
	}, [displayData, searchParams]);

	if (isLoading) {
		return <Spinner />;
	}

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
						data={currentPageData}
						callback={searchCallback}
						sortCallback={sortCallback}
						searchText={getParamByKey('searchText')}
					/>
					<hr />
					<Pagination totalRowCount={displayData?.length} pageSize={10} />
				</>
			) : null}
		</div>
	);
}
