import React from 'react';
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
		<InputText name="searchText" debounceMs={250} onChange={handleChange} label="Search" />
	);
};
