import { Statistic } from '../Common/Statistic';

export default function CounterDisplay({ count }: { count: number }) {
	return (
		<Statistic label='Counter' value={count} />
	);
}
