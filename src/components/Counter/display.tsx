import { Statistic } from 'semantic-ui-react';

export default function CounterDisplay({ count }: { count: number }) {
	return (
		<Statistic>
			<Statistic.Value>{count}</Statistic.Value>
			<Statistic.Label>Counter</Statistic.Label>
		</Statistic>
	);
}
