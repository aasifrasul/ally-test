import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import useBookStore, { Book, BookStoreState } from '../../store/bookStore';

import { InputText } from '../Common/InputText';

export const SearchBook = () => {
	const { filterByText } = useBookStore();

	return (
		<div className="relative flex items-center rounded-md md:w-1/2">
			<InputText
				className="peer hidden w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500 md:block"
				name="searchText"
				size="md"
				debounceMs={250}
				onChange={filterByText}
				placeholder="Search Book"
			/>
			<MagnifyingGlassIcon className="absolute left-3 h-5 w-5 text-gray-400" />
		</div>
	);
};
