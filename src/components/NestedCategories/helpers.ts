import { Category } from './types';

export const buildNestedStructure = (items: Category[]) => {
	const nestedStructure = Object.create(null);
	const categories: Category[] = [];
	const uniqueCategories: Record<string, boolean> = {};

	items.forEach((item: Category) => {
		const { id, category, parent_objective_id } = item;
		if (parent_objective_id) {
			const parentElem = nestedStructure[parent_objective_id];
			if (parentElem) {
				if (!parentElem.children) {
					parentElem.children = [];
				}
				parentElem.children.push(item);
			}
		} else {
			nestedStructure[id] = item;
			if (category && !(category in uniqueCategories)) {
				uniqueCategories[category] = true;
				categories.push({
					id,
					title: category,
				});
			}
		}
	});

	return { nestedStructure, categories };
};
