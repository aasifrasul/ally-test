import { useSearchParams } from 'react-router-dom';

type FilterValue = 'all' | 'active' | 'completed'; // Example filter values

export const useFilter = () => {
	const [searchParams, setSearchParams] = useSearchParams();

	const filter = (searchParams.get('filter') as FilterValue) || 'all';

	const setFilter = (newFilter: FilterValue) => {
		const urlSearchParams = new URLSearchParams(searchParams);
		urlSearchParams.set('filter', newFilter);
		setSearchParams(urlSearchParams);
	};

	return { filter, setFilter };
};
