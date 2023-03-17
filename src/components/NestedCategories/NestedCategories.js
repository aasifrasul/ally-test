import React, { useState, useEffect, useRef, useReducer } from 'react';

import Checkbox from '../Common/Checkbox';
import Spacer from '../Common/Spacer/Spacer1';
import DropDown from '../Common/DropDown/DropDown';
import ScrollToTop from '../Common/ScrollToTopButton/ScrollToTop';

import useFetch from '../../hooks/useFetch';

import { getArrayCount, buildNestedWithParentId, alphabets } from '../../utils/ArrayUtils';

import { FetchStoreProvider } from '../../Context/dataFetchContext';

import styles from './NestedCategories.css';

const schema = 'nestedCategories';

function DisplayList(props) {
	const [categories, setCategories] = useState([]);
	const [selectedParents, setSelectedParents] = useState(new Map());
	const [categoriesChecked, setCategoresChecked] = useState(new Map());
	const [filteredData, setFilteredData] = useState(Object.create(null));
	const [allData, setAllData] = useState(Object.create(null));

	const didMount = useRef(false);
	const addEvents = useRef(false);
	const parent = [];
	let childHtml = [];
	const categoriesHtml = [];
	let count = 0;

	const url = `https://okrcentral.github.io/sample-okrs/db.json`;
	const { state, errorMessage, updateUrl } = useFetch(schema, url);

	useEffect(() => {
		successCallback();
	}, [state.data]);
	useEffect(() => {
		if (!didMount.current) {
			didMount.current = true;
		} else {
			if (addEvents.current) {
				const arrowUpDown = styles['arrow-up-down'];
				const arrowUpDownUp = styles['up'];
				const hidden = styles['hidden'];
				document.body.addEventListener(
					'click',
					(event) => {
						const { target } = event;
						if (!target.classList.contains(arrowUpDown)) {
							return;
						}
						if (target.classList.contains(arrowUpDownUp)) {
							target.classList.remove(arrowUpDownUp);
							target.parentElement.parentElement.childNodes[1].children[1].classList.remove(hidden);
						} else {
							target.classList.add(arrowUpDownUp);
							target.parentElement.parentElement.childNodes[1].children[1].classList.add(hidden);
						}
					},
					false,
				);
			}
			addEvents.current = true;
		}

		return () => {
			document.body.removeEventListener('click', (event) => {});
		};
	}, [categories, categoriesChecked, filteredData, selectedParents]);

	function failureCallback(res) {}

	function successCallback(res) {
		if (!state.isLoading && !state.isError && state.data) {
			const { nestedStructure, categories: allCategories } = buildNestedWithParentId(state.data);
			setAllData(nestedStructure);
			setFilteredData(nestedStructure);
			setCategories(allCategories);
		}
	}

	const handleParentSelection = (checked, value) => {
		// Handling the elemnt checked
		console.log('checked, value', checked, value);
		checked ? selectedParents.set(value, true) : selectedParents.delete(value);
		setSelectedParents(new Map(selectedParents));
	};

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

	for (let key in filteredData) {
		let childCount = 0;
		const { id, title, children } = filteredData[key];
		childHtml = [];
		key = <span>{key + (selectedParents.has(key) ? ' Children Hidden' : '')}</span>;

		!selectedParents.has(id) &&
			getArrayCount(children) &&
			children.forEach((item, key) => {
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
					<div className={styles['arrow-up-down']}></div>
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

	const toggleItem = (id, key) => {
		const temp = [...categories];

		temp[id].selected = !temp[id].selected;
		setCategories(temp);
	};

	const resetThenSet = (id, key) => {
		const temp = [...categories];

		temp.forEach((item) => (item.selected = false));
		temp[id].selected = true;
		setCategories(temp);
	};

	return (
		<>
			<Spacer size={16} />
			<ScrollToTop />
			<DropDown title="Select a category" options={categories} selectHandler={handleCategoriesSelection} />
			{/*
				<DropDown
					titleHelper="Category"
					titleHelperPlural="Categories"
					title="Select Category"
					list={categories}
					toggleItem={toggleItem}
				/>
	*/}
			<div className={styles['home']}>{parent}</div>
		</>
	);
}

const NestedCategories = (props) => (
	<FetchStoreProvider>
		<DisplayList {...props} />
	</FetchStoreProvider>
);

export default NestedCategories;
