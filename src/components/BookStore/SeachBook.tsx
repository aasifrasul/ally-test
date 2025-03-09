import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import { InputText } from '../Common/InputText';

interface Props {
	onChange: (text: string) => void;
}

export const SearchBook: React.FC<Props> = ({ onChange }) => {
	const handleChange = (text: string) => {
		console.log('text', text);
		onChange(text);
	};

	return (
		<div className="relative flex items-center rounded-md md:w-1/2">
			<InputText
				className="peer hidden w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500 md:block"
				name="searchText"
				size="md"
				debounceMs={250}
				onChange={handleChange}
				placeholder="Search Book"
			/>
			<MagnifyingGlassIcon className="absolute left-3 h-5 w-5 text-gray-400" />
		</div>
	);
};
