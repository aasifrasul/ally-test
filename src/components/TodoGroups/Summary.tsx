import { computed } from '@preact/signals-react';
import { useSignals } from '@preact/signals-react/runtime';
import { store } from './TodoList';

const groupCnt = computed(() => store.groups.value.length);
const totalCnt = computed(() =>
	store.groups.value.reduce((sum, { items }) => sum + items.value.length, 0),
);
const completedCnt = computed(() =>
	store.groups.value.reduce(
		(sum, { items }) =>
			sum + items.value.filter(({ completed }) => completed.value).length,
		0,
	),
);

export const Summary: React.FC = () => {
	console.log('render summary');
	useSignals();
	return (
		<div>
			<p>Groups: {groupCnt}</p>
			<p>
				Todos: {completedCnt}/{totalCnt}
			</p>
		</div>
	);
};
