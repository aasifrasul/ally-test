import { Segment } from 'semantic-ui-react';

import { CounterContextProvider, useCounterContext } from '../../Context/CounterContext';

import Display from './display';
import Button from './button';

function Counter() {
	const { count, setCount } = useCounterContext();

	return (
		<>
			<h3>Counter</h3>
			<Segment textAlign="center">
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
