import React, { useState } from 'react';
import { Button } from 'semantic-ui-react';

import { constants } from '../../utils/Constants';

const { allPossibleWinningCombo, allowedOptions } = constants?.tictactoe;

let count = 0;
let isAStreak = false;

const getElementById = (id) => id && document.querySelector(`#${id}`);
const getValueById = (id) => id && getElementById(id)?.value;
const getAllNodes = () => document.querySelectorAll('[id^="idx-"]');

export default function tictactoe(props) {
	const [value, setValue] = useState('');
	const [chance, setChance] = useState(0);

	const checkForStreakComplete = (value) => {
		const checkForStreak = (id1, id2, id3) =>
			value && [getValueById(id1), getValueById(id2), getValueById(id3)].every((key) => key === value);

		allPossibleWinningCombo.forEach((keys) => {
			if (!isAStreak) {
				isAStreak = checkForStreak(...keys);
				isAStreak &&
					keys.forEach((key) => {
						getElementById(key).style.backgroundColor = 'green';
					});
			}
		});

		isAStreak && getAllNodes().forEach((node) => node.setAttribute('readonly', true));
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

	const handleRestart = () => (e) => {
		getAllNodes().forEach((node) => {
			node.value = '';
			node.style.backgroundColor = 'white';
			node.removeAttribute('readonly');
		});
		setValue('');
		setChance(0);
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
			<h3>
				<Button primary onClick={handleRestart()}>
					Re-start
				</Button>
			</h3>
			<h3>Player {chance + 1}</h3>
			{html}
		</>
	);
}
