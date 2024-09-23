import { Signal, signal } from '@preact/signals-react';
import { useSignals } from '@preact/signals-react/runtime';
import { ItemData, TodoItem, createItem } from './TodoItem';

export interface GroupData {
	label: Signal<string>;
	items: Signal<ItemData[]>;
}

interface Props {
	data: GroupData;
	onDelete: () => void;
}

export const createGroup = (label: string): GroupData => ({
	label: signal(label),
	items: signal([]),
});

export const TodoGroup: React.FC<Props> = ({ data: { label, items }, onDelete }) => {
	useSignals();
	return (
		<>
			Group Name:{' '}
			<input
				type="text"
				value={label.value}
				onChange={(e) => {
					label.value = e.target.value;
				}}
			/>{' '}
			<button onClick={onDelete}>remove</button>
			<ul>
				{items.value.map((item, index) => (
					<li key={`item-${index}`}>
						<TodoItem data={item} />
					</li>
				))}
			</ul>
			<button
				onClick={() =>
					(items.value = [...items.value, createItem('todo ' + items.value.length)])
				}
			>
				+ add item
			</button>
		</>
	);
};
