import { signal } from '@preact/signals-react';
import { useSignals } from '@preact/signals-react/runtime';
import { TodoGroup, GroupData, createGroup } from './TodoGroup';

// We'll export the main store so it's also accessible from any component outside of this one.
// It could also be exported from a different file, we'll just colocate it here for simplicity.
export const store = {
	groups: signal<GroupData[]>([]),
};

const addGroup = () => {
	store.groups.value = [
		...store.groups.value,
		createGroup('group ' + store.groups.value.length),
	];
};
const removeGroup = (group: GroupData) => {
	store.groups.value = store.groups.value.filter((candidate) => candidate != group);
};

export function TodoList() {
	useSignals();
	return (
		<div>
			<ol>
				{store.groups.value.map((group, index) => (
					<li key={`group-${index}`}>
						<TodoGroup data={group} onDelete={() => removeGroup(group)} />
					</li>
				))}
			</ol>
			<button onClick={addGroup}>+ add group</button>
		</div>
	);
}
