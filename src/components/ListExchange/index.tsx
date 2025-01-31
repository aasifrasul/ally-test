import React from 'react';

import './styles.css';

interface Row {
	key: number;
	value: string;
}

interface ButtonProps {
	isDisabled: boolean;
	title: string;
	text: string;
	onClick: () => void;
}

interface ListProps {
	data: Row[];
	callback: (keys: number[]) => void;
}

interface CheckboxProps {
	id: number;
	label: string;
	checked: boolean;
	callback: (isChecked: boolean, key: number) => void;
}

function Button({ isDisabled, title, text, onClick }: ButtonProps) {
	const attributes = {
		title,
		onClick,
		disabled: isDisabled,
	};

	if (isDisabled) {
		attributes.title = 'Button is disabled';
	}

	return <button {...attributes}>{text}</button>;
}

function Checkbox({ id, label, checked, callback }: CheckboxProps) {
	const [isChecked, setIsChecked] = React.useState(checked || false);

	const handleChange = () => {
		setIsChecked((checked) => !checked);
		callback(!isChecked, id);
	};

	const name = `checkBox-${id}`;

	return (
		<div className="checkbox-wrapper">
			<label htmlFor={name}>{label}</label>
			<input name={name} type="checkbox" checked={isChecked} onChange={handleChange} />
		</div>
	);
}

function List(props: ListProps) {
	const [keys, setKeys] = React.useState<number[]>([]);

	const handleCheck = (isChecked: boolean, key: number) => {
		setKeys((prevKeys) =>
			isChecked ? [...prevKeys, key] : prevKeys.filter((k) => k !== key),
		);
	};

	const handleClick = () => {
		props.callback(keys);
		setKeys([]);
	};

	const rows = props?.data?.map(({ key, value }) => {
		return (
			<div key={key}>
				<Checkbox id={key} label={value} callback={handleCheck} checked={false} />
			</div>
		);
	});

	return (
		<div>
			{rows}
			<Button
				isDisabled={!keys.length}
				onClick={handleClick}
				text={'Push otherside'}
				title={'Push otherside'}
			/>
		</div>
	);
}

export default function App() {
	const [list1, setlist1] = React.useState<Row[]>([
		{ key: 1, value: 'one' },
		{ key: 2, value: 'two' },
		{ key: 3, value: 'three' },
		{ key: 4, value: 'four' },
		{ key: 5, value: 'five' },
	]);
	const [list2, setlist2] = React.useState<Row[]>([
		{ key: 6, value: 'six' },
		{ key: 7, value: 'seven' },
		{ key: 8, value: 'eigth' },
		{ key: 9, value: 'nine' },
		{ key: 10, value: 'ten' },
	]);

	const handleListTransfer = (
		sourceList: Row[],
		setSourceList: React.Dispatch<React.SetStateAction<Row[]>>,
		targetList: Row[],
		setTargetList: React.Dispatch<React.SetStateAction<Row[]>>,
		keys: number[],
	) => {
		const [newSourceList, itemsToMove] = sourceList.reduce<[Row[], Row[]]>(
			([keep, move], item) => {
				return keys.includes(item.key)
					? [keep, [...move, item]]
					: [[...keep, item], move];
			},
			[[], []],
		);

		setSourceList(newSourceList);
		setTargetList([...targetList, ...itemsToMove]);
	};

	return (
		<div className="App">
			<List
				data={list1}
				callback={(keys) => handleListTransfer(list1, setlist1, list2, setlist2, keys)}
			/>
			<div>--------------------</div>
			<List
				data={list2}
				callback={(keys) => handleListTransfer(list2, setlist2, list1, setlist1, keys)}
			/>
		</div>
	);
}
