import React, { useState, useRef, useCallback, useEffect } from 'react';

import { fetchAPIData } from '../../utils/handleAsyncCalls';
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
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.NONE);
	const originalUsers = useRef<User[]>([]);

	// Fetch users on component mount instead of requiring button click
	useEffect(() => {
		fetchUsers();
	}, []);

	const fetchUsers = async () => {
		setIsLoading(true);
		setError(null);

		const result = await fetchAPIData(fetch(API_URL));
		setIsLoading(false);

		if (!result.success) {
			setError(
				result.error instanceof Error ? result.error.message : 'Failed to fetch users',
			);
			return;
		}

		const data: User[] = result.data as User[];
		originalUsers.current = data;
		setUsers(data);
	};

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

			{error && <div className="text-red-500 mb-4">Error: {error}</div>}

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
