import React from 'react';
import { useTimer } from '../../hooks/useTimer';
import { safelyExecuteFunction } from '../../utils/typeChecking';
import { shuffle } from '../../utils/ArrayUtils';
import { MOCK, blankCard } from './mock';
import * as styles from './styles.module.css';

interface Card {
	name: string;
	pic: string;
	display: boolean;
}

export default function FlipTheCard(): React.JSX.Element {
	const cards = React.useRef<Card[]>(shuffle(MOCK));
	const solvedCards = React.useRef<number>(0);

	// To store the indexes of the opened cards
	const [openCards, setOpenCards] = React.useState<number[]>([]);

	const { seconds, handleReset, handleStop } = useTimer();

	const handleClick = (index: number): void => {
		if (openCards.length < 2) {
			setOpenCards((items) => [...items, index]);
			cards.current[index].display = true;
		}
	};

	React.useEffect(() => {
		if (openCards.length === 2) {
			const card0 = cards.current[openCards[0]];
			const card1 = cards.current[openCards[1]];
			card1.display = true;
			card0.display = true;
			solvedCards.current += 2;

			if (card1.name !== card0.name) {
				requestAnimationFrame(() => {
					const timerId = setTimeout(() => {
						card1.display = false;
						card0.display = false;
						solvedCards.current -= 2;
						setOpenCards(() => []);
						clearTimeout(timerId);
					}, 1000);
				});
			} else {
				if (solvedCards.current === cards.current.length) {
					safelyExecuteFunction(handleStop, null);
				}
				setOpenCards(() => []);
			}
		}
	}, [openCards.length, handleStop]);

	const restart = (): void => {
		cards.current = shuffle(MOCK);
		setOpenCards(() => []);
		safelyExecuteFunction(handleReset, null);
	};

	return (
		<>
			<div className={styles.center}>
				<div>Time: {seconds}</div>
				<div>
					<button onClick={restart}>Restart</button>
				</div>
			</div>
			<div className={styles.parent}>
				{cards.current.map(({ pic, display, name }, index) =>
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
