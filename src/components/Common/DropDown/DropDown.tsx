import React from 'react';

interface Option {
	id: string | number;
	title: string;
}

interface DropDownProps {
	options?: Option[];
	selectHandler: (option: Option | null) => void;
	title: string;
	children?: React.ReactNode;
	defaultValue?: string;
	className?: string;
}

const DropDown: React.FC<DropDownProps> = ({
	options = [],
	selectHandler,
	title,
	children,
	defaultValue,
	className = '',
}) => {
	const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const { selectedIndex } = event.target;
		// Subtract 1 from selectedIndex to account for the title option
		const selectedOption = selectedIndex === 0 ? null : options[selectedIndex - 1];
		selectHandler(selectedOption);
	};

	return (
		<div className={`${className}`}>
			<select
				onChange={handleChange}
				defaultValue={defaultValue}
				className="w-full px-4 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			>
				<option value="">{title}</option>
				{options.map(({ id, title: optionTitle }) => (
					<option key={id} value={optionTitle}>
						{optionTitle}
						{children}
					</option>
				))}
			</select>
		</div>
	);
};

export default DropDown;
