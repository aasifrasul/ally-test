import React, { useState } from 'react';

const getElementById = (id) => id && document.querySelector(`#${id}`);
const getValueById = (id) => id && getElementById(id)?.value;

const allKeys = [
	[`idx-r1-c1`, `idx-r1-c2`, `idx-r1-c3`],
	[`idx-r2-c1`, `idx-r2-c2`, `idx-r2-c3`],
	[`idx-r3-c1`, `idx-r3-c2`, `idx-r3-c3`],
	[`idx-r1-c1`, `idx-r2-c1`, `idx-r3-c1`],
	[`idx-r1-c2`, `idx-r2-c2`, `idx-r3-c2`],
	[`idx-r1-c3`, `idx-r2-c3`, `idx-r3-c3`],
	[`idx-r1-c1`, `idx-r2-c2`, `idx-r3-c3`],
	[`idx-r1-c3`, `idx-r2-c2`, `idx-r3-c1`],
];

const allowedOptions = ['O', 'X'];
let count = 0;
let isAStreak = false;

export default function tictactoe(props) {
	const [value, setValue] = useState('');
	const [chance, setChance] = useState(0);

	const checkForStreakComplete = (value) => {
		const checkForStreak = (id1, id2, id3) =>
			value && [getValueById(id1), getValueById(id2), getValueById(id3)].every((key) => key === value);

		allKeys.forEach((keys) => {
			if (!isAStreak) {
				isAStreak = checkForStreak(...keys);
				isAStreak &&
					keys.forEach((key) => {
						getElementById(key).style.backgroundColor = 'green';
					});
			}
		});

		isAStreak && document.querySelectorAll('[id^="idx-"]').forEach((node) => node.setAttribute('readonly', true));
	};

	const handleChange = (key) => (e) => {
		let currentValue = `${e?.target?.value}`.toUpperCase();
		const id = e?.target?.id;
		const currentElement = getElementById(id);

		if (value === currentValue) {
			alert('Please select the other value');
			currentElement.value = null;
			return;
		}
		if (!allowedOptions.includes(currentValue)) {
			alert('Please add either X or O');
			currentElement.value = null;
			return;
		}

		currentElement.value = currentValue;
		currentElement.setAttribute('readonly', true);
		setValue(() => currentValue);
		setChance(() => !chance);
	};

	React.useEffect(() => {
		checkForStreakComplete(value);
	}, [value]);

	const html = [1, 2, 3].map((i) => (
		<div>
			{[1, 2, 3].map((j) => {
				return (
					<span>
						<textarea
							id={`idx-r${i}-c${j}`}
							key={`idx-r${i}-c${j}`}
							type="text"
							onChange={handleChange(count)}
							style={{ height: '150px', width: '150px', textAlign: 'center', fontSize: '150px' }}
						/>
					</span>
				);
			})}
		</div>
	));

	return (
		<>
			<div>Player {chance + 1}</div>
			{html}
		</>
	);
}
