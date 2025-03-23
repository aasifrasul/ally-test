import { Segment } from 'semantic-ui-react';

import { CounterContextProvider } from '../../Context/CounterContext';
import Display from './display';
import Button from './button';

export default function CounterView() {
	return (
		<CounterContextProvider>
			<h3>Counter</h3>
			<Segment textAlign="center">
				<Display />
				<Button />
			</Segment>
		</CounterContextProvider>
	);
}
