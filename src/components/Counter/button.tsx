import React, { useContext } from 'react';
import { Button } from 'semantic-ui-react';

import { useCounterContext } from '../../Context/CounterContext';

import CustomButton from './CustomButton';

export default function CounterButtons() {
	const [count, setCount] = useCounterContext();

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
