import React, { useState, useEffect } from 'react';

import Spacer from '../Common/Spacer/Spacer1';
import DropDown from '../Common/DropDown/DropDown';
import ScrollToTop from '../Common/ScrollToTopButton';

import { buildNestedWithParentId, alphabets } from '../../utils/ArrayUtils';

import styles from './NestedCategories.module.css';

interface Category {
	id: string;
	title: string;
	children?: Category[];
	hideChildren?: boolean;
	category?: string;
}

interface NestedCategoriesProps {
	isLoading: boolean;
	data: any; // Type this based on your actual data structure
	isError: boolean;
}

interface BuildNestedResult {
	nestedStructure: Record<string, Category>;
	categories: Category[];
}

export const NestedCategories = ({
	isLoading,
	data,
	isError,
}: NestedCategoriesProps): React.ReactElement => {
	const [categories, setCategories] = useState<Category[]>([]);
	const [categoriesChecked, setCategoresChecked] = useState<Map<string, boolean>>(new Map());
	const [filteredData, setFilteredData] = useState<Record<string, Category>>({});
	const [allData, setAllData] = useState<Record<string, Category>>({});

	const parent: JSX.Element[] = [];
	let childHtml: JSX.Element[] = [];
	let count = 0;

	useEffect(() => {
		successCallback();
	}, [data]);

	function successCallback() {
		if (!isLoading && !isError && data) {
			const { nestedStructure, categories: allCategories }: BuildNestedResult =
				buildNestedWithParentId(data);
			setAllData(nestedStructure);
			setFilteredData(nestedStructure);
			setCategories(allCategories);
		}
	}

	interface Option {
		id: string | number;
		title: string;
	}

	const handleCategoriesSelection = (value: Option | null) => {
		// Collecting all the checked categories
		categoriesChecked.clear();
		value && categoriesChecked.set(value.title, true);
		setCategoresChecked(new Map(categoriesChecked));
		handleFilteredData(categoriesChecked);
	};

	const handleFilteredData = (parentCategoresChecked: Map<string, boolean>) => {
		let hash: Record<string, Category> = {};
		let item: Category | null = null;

		if (parentCategoresChecked.size) {
			for (let key in allData) {
				item = allData[key];
				if (item.category && parentCategoresChecked.has(item.category)) {
					hash[key] = item;
				}
			}
		} else {
			hash = { ...allData };
		}
		setFilteredData(hash);
	};

	const handleToggleChildren = (id: string) => {
		setFilteredData((items) => {
			const newItems = { ...items };
			if (newItems[id]) {
				newItems[id].hideChildren = !newItems[id].hideChildren;
			}
			return newItems;
		});
	};

	for (let key in filteredData) {
		let childCount = 0;
		const { id, title, children, hideChildren } = filteredData[key];
		childHtml = [];

		!hideChildren &&
			children?.forEach((item, index) => {
				const { id, title } = item || {};
				title &&
					childHtml.push(
						<div key={id}>
							{alphabets[childCount++]}. {title}
						</div>,
					);
			});

		parent.push(
			<div key={id}>
				<div className={styles['dev-wrapper']}>
					<div onClick={() => handleToggleChildren(id)}>
						{hideChildren ? '▶' : '▼'}
					</div>
				</div>
				<div>
					<span className={styles['category_parent']}>
						{++count}. {title}
					</span>
					<div className={styles['category_children']}>{childHtml}</div>
				</div>
				<Spacer size={16} />
			</div>,
		);
	}

	return (
		<>
			<Spacer size={16} />
			<ScrollToTop />
			<DropDown
				title="Select a category"
				options={categories}
				selectHandler={handleCategoriesSelection}
			/>
			<div className={styles['home']}>{parent}</div>
		</>
	);
};
