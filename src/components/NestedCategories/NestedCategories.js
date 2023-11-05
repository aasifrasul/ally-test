import React, { useState, useEffect } from 'react';

import Spacer from '../Common/Spacer/Spacer1';
import DropDown from '../Common/DropDown/DropDown';
import ScrollToTop from '../Common/ScrollToTopButton/ScrollToTop';

import ConnectDataFetch from '../../HOCs/ConnectDataFetch';

import { buildNestedWithParentId, alphabets } from '../../utils/ArrayUtils';

import styles from './NestedCategories.css';

const schema = 'nestedCategories';

function NestedCategories({ isLoading, data, isError, fetchData }) {
	const [categories, setCategories] = useState([]);
	const [categoriesChecked, setCategoresChecked] = useState(new Map());
	const [filteredData, setFilteredData] = useState({});
	const [allData, setAllData] = useState({});

	const parent = [];
	let childHtml = [];
	let count = 0;

	useEffect(() => {
		successCallback();
	}, [data]);

	function successCallback() {
		if (!isLoading && !isError && data) {
			const { nestedStructure, categories: allCategories } =
				buildNestedWithParentId(data);
			setAllData(nestedStructure);
			setFilteredData(nestedStructure);
			setCategories(allCategories);
		}
	}

	const handleCategoriesSelection = (value) => {
		// Collecting all the checked categories
		categoriesChecked.clear();
		value && categoriesChecked.set(value.title, true);
		setCategoresChecked(new Map(categoriesChecked));
		handleFilteredData(categoriesChecked);
	};

	const handleFilteredData = (parentCategoresChecked) => {
		let hash = Object.create(null);
		let item = null;

		if (parentCategoresChecked.size) {
			for (let key in allData) {
				item = allData[key];
				if (parentCategoresChecked.has(item.category)) {
					hash[key] = item;
				}
			}
		} else {
			hash = Object.assign({}, allData);
		}
		setFilteredData(hash);
	};

	const handleToggleChildren = (id) => {
		setFilteredData((items) => {
			const newItems = { ...items };
			newItems[id].hideChildren = !newItems[id].hideChildren;
			return newItems;
		});
	};

	for (let key in filteredData) {
		let childCount = 0;
		const { id, title, children, hideChildren } = filteredData[key];
		childHtml = [];

		!hideChildren &&
			children?.forEach((item, key) => {
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
}

NestedCategories.schema = schema;

export default ConnectDataFetch(null, null)(NestedCategories);
