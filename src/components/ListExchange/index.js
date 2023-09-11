import React from 'react';

import './styles.css';

function Button({ isDisabled, title, text, onClick }) {
	const attributes = {
		title,
		onClick,
	};
	if (isDisabled) {
		attributes.disabled = true;
		attributes.title = 'Button is disabled';
	}

	return <button {...attributes}>{text}</button>;
}

function Checkbox({ id, label, checked, callback }) {
	const [isChecked, setIsChecked] = React.useState(checked || false);

	React.useEffect(() => {
		return () => setIsChecked(false);
	}, []);

	const handleChange = () => {
		setIsChecked((checked) => !checked);
		callback(!isChecked, id);
	};

	return (
		<div className="checkbox-wrapper">
			<label htmlFor={id}>{label}</label>
			<input
				id={id}
				type="checkbox"
				checked={isChecked}
				onChange={handleChange}
				label={label}
			/>
		</div>
	);
}

function List(props) {
	const [keys, setKeys] = React.useState([]);

	const handleCheck = (isChecked, key) => {
		let items = [...keys];
		if (isChecked) {
			items.push(key);
		} else {
			items.splice(items.indexOf(key), 1);
		}
		setKeys(items);
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
			<Button isDisabled={!keys.length} onClick={handleClick} text={'Push otherside'} />
		</div>
	);
}

export default function App() {
	const [list1, setlist1] = React.useState([
		{ key: 1, value: 'one' },
		{ key: 2, value: 'two' },
		{ key: 3, value: 'three' },
		{ key: 4, value: 'four' },
		{ key: 5, value: 'five' },
	]);
	const [list2, setlist2] = React.useState([
		{ key: 6, value: 'six' },
		{ key: 7, value: 'seven' },
		{ key: 8, value: 'eigth' },
		{ key: 9, value: 'nine' },
		{ key: 10, value: 'ten' },
	]);

	const clickHandler2 = (keys) => {
		const newList = list2.filter((item) => {
			if (keys.indexOf(item.key) >= 0) {
				list1.push(item);
				return false;
			}
			return true;
		});

		setlist2([...newList]);
		setlist1([...list1]);
	};

	const clickHandler1 = (keys) => {
		const newList = list1.filter((item) => {
			if (keys.indexOf(item.key) >= 0) {
				list2.push(item);
				return false;
			}
			return true;
		});

		setlist2([...list2]);
		setlist1([...newList]);
	};

	return (
		<div className="App">
			<List data={list1} callback={clickHandler1} />
			<div>--------------------</div>
			<List data={list2} callback={clickHandler2} />
		</div>
	);
}
