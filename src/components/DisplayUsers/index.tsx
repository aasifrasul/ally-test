import { useMemo, useState } from 'react';

import { subscribeWithCallback, executeQuery, invalidateCache } from '../../graphql/client';
import ScrollToTop from '../Common/ScrollToTopButton';
import useEffectOnce from '../../hooks/useEffectOnce';

import { SearchUser } from './SearchUser';
import { UserForm } from './UserForm';
import { UsersList } from './UsersList';

import { createLogger, LogLevel, Logger } from '../../utils/Logger';
import { User, AddUser, UpdateUser, EditUser, DeleteUser } from './types';

const logger: Logger = createLogger('DisplayUsers', {
	level: LogLevel.DEBUG,
});

export default function DisplayUsers() {
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [users, setUsers] = useState<User[]>([]);
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [editingUser, setEditingUser] = useState<User | null>(null);

	const filteredUsers = useMemo(() => {
		if (!searchTerm.trim()) return users;
		const searchText = searchTerm.trim().toLowerCase();

		return users.filter((user) => {
			const searchFields = [
				user.first_name.trim().toLowerCase(),
				user.last_name.trim().toLowerCase(),
				user.age.toString(),
			];
			return searchFields.some((field) => field.includes(searchText));
		});
	}, [users, searchTerm]);

	useEffectOnce(() => {
		let unsubscribe: (() => void) | null = null;

		const loadInitialData = async () => {
			try {
				setIsLoading(true);
				setError(null);

				// Load initial users - now with caching!
				const { getUsers = [] } = await executeQuery<{ getUsers: User[] }>(
					`{ getUsers { id, first_name, last_name, age } }`,
					{}, // no variables
					5000, // timeout
					{ cache: true, cacheTTL: 5 * 60 * 1000 }, // 5 minute cache
				);

				setUsers(getUsers);

				// Set up subscription for real-time updates
				unsubscribe = subscribeWithCallback<{ userCreated: User }>(
					'subscription { userCreated { id, first_name, last_name, age } }',
					{
						onData: (subscriptionData) => {
							logger.info('New user created:', subscriptionData.userCreated);
							setUsers((prev) => [...prev, subscriptionData.userCreated]);
							// Invalidate users cache when new user is created via subscription
							invalidateCache('getUsers');
						},
						onError: (error) => {
							logger.error('Subscription error:', error);
						},
					},
				);
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : 'Something went wrong';
				setError(errorMessage);
				logger.error('Error loading users:', err);
			} finally {
				setIsLoading(false);
			}
		};

		loadInitialData();

		return () => {
			if (unsubscribe) {
				unsubscribe();
			}
		};
	});

	const addUser: AddUser = async (firstName, lastName, age) => {
		try {
			// Use optimistic mutation for better UX
			const optimisticUser = {
				id: `temp-${Date.now()}`,
				first_name: firstName,
				last_name: lastName,
				age: age,
			};

			// Optimistically update UI
			setUsers((prevData) => [...prevData, optimisticUser]);

			const { createUser } = await executeQuery(
				`mutation createUser($first_name: String!, $last_name: String!, $age: Int!) {
					createUser(first_name: $first_name, last_name: $last_name, age: $age) {
						success 
						message 
						user { id first_name last_name age }
					}
				}`,
				{
					first_name: firstName,
					last_name: lastName,
					age: age,
				},
				5000,
				{ cache: false }, // Don't cache mutations
			);

			const { success, user } = createUser;

			if (success) {
				// Replace optimistic user with real user
				setUsers((prevData) =>
					prevData.map((u) => (u.id === optimisticUser.id ? user : u)),
				);
				// Invalidate cache to ensure fresh data on next query
				invalidateCache('getUsers');
			} else {
				// Remove optimistic user on failure
				setUsers((prevData) => prevData.filter((u) => u.id !== optimisticUser.id));
			}
		} catch (error) {
			// Remove optimistic user on error
			setUsers((prevData) => prevData.filter((u) => u.id.startsWith('temp-')));
			logger.error('Error creating user:', error);
		}
	};

	const updateUser: UpdateUser = async (id, firstName, lastName, age) => {
		try {
			const { updateUser } = await executeQuery(
				`mutation updateUser($id: ID!, $first_name: String!, $last_name: String!, $age: Int!) { 
					updateUser(id: $id, first_name: $first_name, last_name: $last_name, age: $age) { 
						success 
						message 
						user { id first_name last_name age } 
					} 
				}`,
				{
					id,
					first_name: firstName,
					last_name: lastName,
					age,
				},
				5000,
				{ cache: false },
			);

			const { success, user } = updateUser;

			if (success) {
				setUsers((prevData) =>
					prevData.map((item) => (item.id === user.id ? user : item)),
				);
				setEditingUser(null);
				// Invalidate cache
				invalidateCache('getUsers');
			}
		} catch (error) {
			logger.error('Error updating user:', error);
		}
	};

	const handleDeleteUser: DeleteUser = async (id) => {
		try {
			// Optimistic delete
			const originalUsers = users;
			setUsers((prevData) => prevData.filter((item) => item.id !== id));

			const { deleteUser } = await executeQuery(
				`mutation deleteUser($id: ID!) { 
					deleteUser(id: $id) { 
						success 
						message 
						id 
					} 
				}`,
				{ id },
				5000,
				{ cache: false },
			);

			if (!deleteUser.success) {
				// Rollback on failure
				setUsers(originalUsers);
			} else {
				// Invalidate cache
				invalidateCache('getUsers');
			}
		} catch (error) {
			// Rollback on error
			setUsers(users);
			logger.error('Error deleting user:', error);
		}
	};

	const handleEditUser: EditUser = (id) => {
		const user: User | undefined = filteredUsers.find((user) => user.id === id);
		user && setEditingUser(user);
	};

	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (error) {
		return <div>Error: {error}</div>;
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-6xl mx-auto px-4 py-8">
				{/* Header */}
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">📚 All Users</h1>
				</div>

				{/* Main Content */}
				<div className="space-y-8">
					<UserForm
						editingUser={editingUser}
						addUser={addUser}
						updateUser={updateUser}
					/>
					<SearchUser filterByText={setSearchTerm} />
					<UsersList
						users={filteredUsers}
						handleEditUser={handleEditUser}
						handleDeleteUser={handleDeleteUser}
					/>
				</div>

				<ScrollToTop />
			</div>
		</div>
	);
}
