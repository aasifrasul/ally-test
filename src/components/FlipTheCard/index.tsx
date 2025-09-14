import React from 'react';
import { useTimer } from '../../hooks/useTimer';
import { safelyExecuteFunction } from '../../utils/typeChecking';
import { shuffle } from '../../utils/ArrayUtils';
import { MOCK, blankCard } from './mock';
import styles from './styles.module.css';

export interface Card {
	name: string;
	pic: string;
	display: boolean;
}

export interface FlipTheCardProps {
	mockCards?: Card[];
	onGameComplete?: () => void;
}

export default function FlipTheCard({
	mockCards = MOCK,
	onGameComplete,
}: FlipTheCardProps): React.JSX.Element {
	const cards = React.useRef<Card[]>(shuffle([...mockCards]));
	const solvedCards = React.useRef<number>(0);
	// To store the indexes of the opened cards
	const [openCards, setOpenCards] = React.useState<number[]>([]);
	const { seconds, stop, reset } = useTimer();

	const handleClick = (index: number): void => {
		if (openCards.length < 2 && !cards.current[index].display) {
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
				solvedCards.current += 2;
				if (solvedCards.current === cards.current.length) {
					safelyExecuteFunction(stop, null);
					if (onGameComplete) {
						onGameComplete();
					}
				}
				setOpenCards(() => []);
			}
		}
	}, [openCards.length, stop, onGameComplete]);

	const restart = (): void => {
		cards.current = shuffle([...mockCards]);
		solvedCards.current = 0;
		setOpenCards(() => []);
		safelyExecuteFunction(reset, null);
	};

	return (
		<div data-testid="flip-card-game">
			<div className={styles.center}>
				<div data-testid="timer">Time: {seconds}</div>
				<div>
					<button
						onClick={restart}
						className={styles.restart}
						data-testid="restart-button"
					>
						Restart
					</button>
				</div>
			</div>
			<div className={styles.parent}>
				{cards.current.map(({ pic, display, name }, index) => (
					<div
						key={`${name}-${index}`}
						className={`${styles.child} ${display ? 'card-open' : ''}`}
						data-testid={`card-${index}`}
						data-card-name={name}
					>
						{display ? (
							<img src={pic} alt={name} data-testid={`card-image-${index}`} />
						) : (
							<img
								src={blankCard}
								onClick={() => handleClick(index)}
								alt="Card back"
								data-testid={`card-back-${index}`}
							/>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
