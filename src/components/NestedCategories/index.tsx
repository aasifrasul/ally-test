import { FC, useState, useMemo, useCallback } from 'react';

import { useApi } from '../../utils/api-client/hooks/useApi';
import { useEffectOnce } from '../../hooks/useEffectOnce';
import Spacer from '../Common/Spacer';
import ScrollToTop from '../Common/ScrollToTopButton';
import { alphabets } from '../../utils/ArrayUtils';
import { buildNestedStructure } from './helpers';

import { Category, NestedCategoriesProps, SelectChangeEvent } from './types';
import styles from './NestedCategories.module.css';
import { isObject } from '../../utils/typeChecking';

export const NestedCategories: FC<NestedCategoriesProps> = ({
	data: initialData,
	fetchUrl = 'https://okrcentral.github.io/sample-okrs/db.json',
}) => {
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());

	const { execute, data, isLoading, error } = useApi();

	useEffectOnce(() => {
		execute(fetchUrl);
	});

	// Memoized nested data processing
	const { nestedStructure, categories } = useMemo(() => {
		const items: Category[] =
			isObject(data) && 'data' in data ? (data as { data: Category[] })!.data : [];
		return buildNestedStructure(items);
	}, [data]);

	// Handle category selection
	const handleCategorySelection = useCallback((text: string) => {
		setSelectedCategory(text);
	}, []);

	// Filter and process categories
	const filteredCategories = useMemo(() => {
		return (Object.values(nestedStructure) as Category[]).filter(
			(category: Category) =>
				!selectedCategory || category.category === selectedCategory,
		);
	}, [nestedStructure, selectedCategory]);

	// Toggle category visibility
	const toggleCategoryVisibility = useCallback((id: string) => {
		setHiddenCategories((prev) => {
			const updated = new Set(prev);
			updated.has(id) ? updated.delete(id) : updated.add(id);
			return updated;
		});
	}, []);

	const onSelectChange = useCallback(
		(event: React.ChangeEvent<HTMLSelectElement>) => {
			const text: string = event.target.selectedOptions[0].text;
			if (text === 'Select a category') {
				handleCategorySelection('');
				return;
			}
			handleCategorySelection(text);
		},
		[handleCategorySelection],
	);

	// Render category with children
	const renderCategory = (category: Category, index: number): React.ReactNode => {
		const isHidden = hiddenCategories.has(category.id);
		const visibleChildren = (category.children || []).filter((child) => child.title);

		return (
			<div key={category.id} className={styles['category-item']}>
				<div className={styles['dev-wrapper']}>
					<div onClick={() => toggleCategoryVisibility(category.id)}>
						{isHidden ? '▶' : '▼'}
					</div>
				</div>
				<div>
					<span className={styles['category_parent']}>
						{index + 1}. {category.title}
					</span>
					{!isHidden && visibleChildren.length > 0 && (
						<div className={styles['category_children']}>
							{visibleChildren.map((child, childIndex) => (
								<div key={child.id}>
									{alphabets[childIndex]}. {child.title}
								</div>
							))}
						</div>
					)}
				</div>
				<Spacer size={16} />
			</div>
		);
	};

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div>Error loading categories</div>;

	return (
		<div>
			<Spacer size={16} />
			<ScrollToTop />
			<select
				onChange={onSelectChange}
				className="w-full px-4 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			>
				<option value="" key="title">
					Select a category
				</option>
				{categories.map(({ id, title }) => (
					<option value={title} key={id}>
						{title}
					</option>
				))}
			</select>
			<div className={styles['home']}>{filteredCategories.map(renderCategory)}</div>
		</div>
	);
};

export default NestedCategories;
