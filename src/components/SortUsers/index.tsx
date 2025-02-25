import { useState, useRef, useCallback, useEffect } from 'react';

import { useApi } from '../../utils/api-client/hooks/useApi';
import { User } from './types';

// Constants should be in SCREAMING_SNAKE_CASE and preferably in a separate config file
const API_URL = 'https://jsonplaceholder.typicode.com/users';

// Enum for sort order improves code readability and maintainability
enum SortOrder {
	ASCENDING = 'ascending',
	DESCENDING = 'descending',
	NONE = 'none',
}

export default function UserList() {
	const [users, setUsers] = useState<User[]>([]);
	const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.NONE);
	const originalUsers = useRef<User[]>([]);

	const { execute, isLoading, error } = useApi<User[]>();

	const fetchUsers = async () => {
		try {
			const data = await execute(API_URL);
			if (data) {
				setUsers(data);
				originalUsers.current = data;
			}
		} catch (error) {
			console.error('Failed:', error);
		}
	};
	useEffect(() => {
		fetchUsers();
	}, []);

	const handleSort = useCallback(() => {
		if (!originalUsers.current.length) return;

		const sortOrders = {
			[SortOrder.NONE]: SortOrder.ASCENDING,
			[SortOrder.ASCENDING]: SortOrder.DESCENDING,
			[SortOrder.DESCENDING]: SortOrder.NONE,
		};

		const nextSortOrder = sortOrders[sortOrder];
		setSortOrder(nextSortOrder);

		const sortedUsers = [...originalUsers.current];
		switch (nextSortOrder) {
			case SortOrder.ASCENDING:
				sortedUsers.sort((a, b) => a.name.length - b.name.length);
				break;
			case SortOrder.DESCENDING:
				sortedUsers.sort((a, b) => b.name.length - a.name.length);
				break;
			default:
				// Reset to original order
				break;
		}

		setUsers(sortedUsers);
	}, [sortOrder]);

	return (
		<main className="p-4">
			<h1 className="text-2xl font-bold mb-4">User List</h1>

			<div className="mb-4 space-x-4">
				<button
					onClick={fetchUsers}
					disabled={isLoading}
					className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
				>
					{isLoading ? 'Loading...' : 'Refresh Users'}
				</button>

				<button
					onClick={handleSort}
					disabled={isLoading || !users.length}
					className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
				>
					Sort by Name Length ({sortOrder})
				</button>
			</div>

			{error && <div className="text-red-500 mb-4">Error: {error.message}</div>}

			{users.length > 0 ? (
				<ul className="space-y-2">
					{users.map((user) => (
						<li key={user.id} className="p-2 bg-gray-100 rounded">
							{user.name} ({user.name.length} characters)
						</li>
					))}
				</ul>
			) : (
				!isLoading && <p>No users found</p>
			)}
		</main>
	);
}
