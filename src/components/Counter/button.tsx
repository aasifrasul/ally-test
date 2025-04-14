import { Button } from 'semantic-ui-react';

import CustomButton from './CustomButton';

import { CounterContextType } from '../../Context/CounterContext';

export default function CounterButtons({ count, setCount }: CounterContextType) {
	const increment = () => () => setCount(count + 1);
	const decrement = () => () => setCount(count - 1);

	return (
		<div>
			<Button.Group>
				<CustomButton text="Add" color="green" callback={increment} />
				<CustomButton text="Minus" color="red" callback={decrement} />
			</Button.Group>
		</div>
	);
}
