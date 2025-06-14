import Button from '../Common/Button';

import { CounterContextType } from '../../Context/CounterContext';

export default function CounterButtons({ count, setCount }: CounterContextType) {
	const increment = () => setCount(count + 1);
	const decrement = () => setCount(count - 1);

	return (
		<div>
			<Button primary positive basic onClick={increment}>
				+
			</Button>
			<Button primary negative basic onClick={decrement}>
				-
			</Button>
		</div>
	);
}
