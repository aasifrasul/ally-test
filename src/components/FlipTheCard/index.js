import React from 'react';

import { shuffle, arrayChunks } from '../../utils/ArrayUtils';
import { MOCK, blankCard } from './mock';

import styles from './styles.css';

export default function FlipTheCard() {
	const flipCards = React.useRef(shuffle(MOCK));

	// To store the indexes of the opened cards
	const [openCards, setOpenCards] = React.useState([]);

	const handleClick = (index) => {
		if (openCards.length < 2) {
			setOpenCards((cards) => [...cards, index]);
			flipCards.current[index].display = true;
		}
	};

	React.useEffect(() => {
		if (openCards.length === 2) {
			const card0 = flipCards.current[openCards[0]];
			const card1 = flipCards.current[openCards[1]];
			card1.display = true;
			card0.display = true;

			if (card1.name !== card0.name) {
				requestAnimationFrame(() => {
					const timerId = setTimeout(() => {
						card1.display = false;
						card0.display = false;
						setOpenCards(() => []);
						clearTimeout(timerId);
					}, 1000);
				});
			} else {
				setOpenCards(() => []);
			}
		}
	}, [openCards.length]);

	const restart = () => {
		flipCards.current = shuffle(MOCK);
		setOpenCards(() => []);
	};

	return (
		<>
			<div className={styles.center}>
				<button onClick={() => restart()}>Restart</button>
			</div>
			<div className={styles.parent}>
				{flipCards.current.map(({ pic, display, name }, index) =>
					display ? (
						<div key={`${name}-${index}`} className={styles.child}>
							<img src={pic} />
						</div>
					) : (
						<div key={`${name}-${index}`} className={styles.child}>
							<img src={blankCard} onClick={() => handleClick(index)} />
						</div>
					),
				)}
			</div>
		</>
	);
}
