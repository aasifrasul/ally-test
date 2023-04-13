import React from 'react';

import { shuffle, arrayChunks } from '../../utils/ArrayUtils';
import { MOCK, blankCard } from './mock';

import styles from './styles.css';

let flipCards = shuffle(MOCK);

export default function FlipTheCard() {
	const [clickedCards, setClickedCards] = React.useState([]);

	const handleClick = (index) => {
		if (clickedCards.length < 2) {
			setClickedCards((cards) => [...cards, index]);
			flipCards[index].display = true;
		}
	};

	React.useEffect(() => {
		if (clickedCards.length === 2) {
			const card0 = flipCards[clickedCards[0]];
			const card1 = flipCards[clickedCards[1]];
			card1.display = true;
			card0.display = true;

			if (card1.name !== card0.name) {
				requestAnimationFrame(() => {
					const timerId = setTimeout(() => {
						card1.display = false;
						card0.display = false;
						setClickedCards(() => []);
						clearTimeout(timerId);
					}, 1000);
				});
			} else {
				setClickedCards(() => []);
			}
		}
	}, [clickedCards.length]);

	const restart = () => {
		flipCards.forEach((_, index) => {
			console.log(flipCards[index] == MOCK[index]);
		});
		flipCards = shuffle(MOCK);
		setClickedCards(() => []);
	};

	return (
		<>
			<div className={styles.center}>
				<button onClick={() => restart()}>Restart</button>
			</div>
			<div className={styles.parent}>
				{flipCards.map(({ pic, display, name }, index) => {
					return display ? (
						<div className={styles.child}>
							<img src={pic} />
						</div>
					) : (
						<div className={styles.child}>
							<img src={blankCard} onClick={() => handleClick(index)} />
						</div>
					);
				})}
			</div>
		</>
	);
}
