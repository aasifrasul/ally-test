export interface Category {
	id: string;
	title: string;
	children?: Category[];
	hideChildren?: boolean;
	category?: string;
	parent_objective_id?: string;
}

export interface NestedCategoriesProps {
	data?: Category[];
	fetchUrl?: string;
}

export interface SelectChangeEvent extends React.ChangeEvent<HTMLSelectElement> {}
