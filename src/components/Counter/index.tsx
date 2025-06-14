import { Segment } from '../Common/Segment';

import { CounterContextProvider, useCounterContext } from '../../Context/CounterContext';

import Display from './display';
import Button from './button';

function Counter() {
	const { count, setCount } = useCounterContext();

	return (
		<>
			<h3>Counter</h3>
			<Segment className="text-center">
				<Display count={count} />
				<Button count={count} setCount={setCount} />
			</Segment>
		</>
	);
}

export default function wrapper() {
	return (
		<CounterContextProvider>
			<Counter />
		</CounterContextProvider>
	);
}
