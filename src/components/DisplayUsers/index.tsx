import { useCallback, useMemo, useState, useEffect } from 'react';

import {
	useQuery,
	useMutation,
	useSubscription,
	useInvalidateCache,
} from '../../graphql/hooks';
import ScrollToTop from '../Common/ScrollToTopButton';
import { getRandomId } from '../../utils/common';

import { SearchUser } from './SearchUser';
import { UserForm } from './UserForm';
import { UsersList } from './UsersList';

import {
	GET_USERS,
	CREATE_USER,
	UPDATE_USER,
	DELETE_USER,
	USER_CREATED_SUBSCRIPTION,
} from './query';

import { createLogger, LogLevel, Logger } from '../../utils/Logger';
import { User } from './types';

const logger: Logger = createLogger('DisplayUsers', {
	level: LogLevel.DEBUG,
});

export default function DisplayUsers() {
	const [users, setUsers] = useState<User[]>([]);
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [editingUser, setEditingUser] = useState<User | null>(null);

	const invalidateCache = useInvalidateCache();

	const { data, isLoading, error } = useQuery(GET_USERS, {});

	const [createUser] = useMutation(CREATE_USER);
	const [updateUser] = useMutation(UPDATE_USER);
	const [deleteUser] = useMutation(DELETE_USER);

	useSubscription(USER_CREATED_SUBSCRIPTION, {
		onSubscriptionData: ({ subscriptionData: { data: userCreated } }) => {
			logger.info('New user created:', userCreated);
			setUsers((prevUsers) => {
				// Prevent duplicates
				if (prevUsers.some((user) => user.id === userCreated.id)) {
					return prevUsers;
				}
				return [userCreated, ...prevUsers];
			});
			invalidateCache('getUsers');
		},
	});

	const filteredUsers = useMemo(() => {
		if (!searchTerm.trim()) return users;
		const searchText = searchTerm.trim().toLowerCase();

		return users.filter((user: User) => {
			const searchFields = [
				user.first_name.trim().toLowerCase(),
				user.last_name.trim().toLowerCase(),
				user.age.toString(),
			];
			return searchFields.some((field) => field.includes(searchText));
		});
	}, [users, searchTerm]);

	useEffect(() => {
		if (data?.getUsers?.length > 0) setUsers(data?.getUsers);
	}, [data?.getUsers]);

	const handleAddUser = useCallback(
		async (first_name: string, last_name: string, age: number) => {
			const tempId = `temp-${getRandomId()}`;
			const optimisticUser = {
				id: tempId,
				first_name,
				last_name,
				age,
			};

			// Add optimistic user
			setUsers((prevUsers) => [optimisticUser, ...prevUsers]);

			try {
				const { createUser: result } = await createUser({
					variables: { first_name, last_name, age },
				});

				if (result.success) {
					// Replace the temp user with the real one
					setUsers((prevUsers) =>
						prevUsers.map((user) => (user.id === tempId ? result.user : user)),
					);
					setEditingUser(null);
					invalidateCache('getUsers');
				} else {
					// Remove the optimistic user on failure
					setUsers((prevUsers) => prevUsers.filter((user) => user.id !== tempId));
				}
			} catch (error) {
				// Remove the optimistic user on error
				setUsers((prevUsers) => prevUsers.filter((user) => user.id !== tempId));
				logger.error('Error creating user:', error);
			}
		},
		[createUser], // Remove 'users' from dependencies
	);

	const handleUpdateUser = useCallback(
		async (id: string, first_name: string, last_name: string, age: number) => {
			const updatedUser = { id, first_name, last_name, age };

			// Store original state for each user at the moment of optimistic update
			let originalUserSnapshot: User | null = null;

			// Optimistic update with snapshot capture
			setUsers((prevUsers: User[]): User[] => {
				const userIndex = prevUsers.findIndex((user) => user.id === id);
				if (userIndex === -1) return prevUsers;

				// Capture the original user data at this moment
				originalUserSnapshot = prevUsers[userIndex];

				return prevUsers.map((item: User) => (item.id === id ? updatedUser : item));
			});

			try {
				const { updateUser: result } = await updateUser({
					variables: updatedUser,
				});

				if (result.success) {
					setEditingUser(null);
					invalidateCache('getUsers');
				} else {
					// Rollback to original user if we captured it
					if (originalUserSnapshot) {
						setUsers((prevUsers: User[]): User[] =>
							prevUsers.map((item: User) =>
								item.id === id ? originalUserSnapshot! : item,
							),
						);
					}
				}
			} catch (error) {
				logger.error('Error updating user:', error);

				// Rollback to original user if we captured it
				if (originalUserSnapshot) {
					setUsers((prevUsers: User[]): User[] =>
						prevUsers.map((item: User) =>
							item.id === id ? originalUserSnapshot! : item,
						),
					);
				}
			}
		},
		[updateUser],
	);

	const handleDeleteUser = useCallback(
		async (id: string) => {
			// Store the user and its position for accurate rollback
			let userSnapshot: { user: User; index: number } | null = null;

			// Optimistic delete with position capture
			setUsers((prevUsers: User[]): User[] => {
				const userIndex = prevUsers.findIndex((user) => user.id === id);
				if (userIndex === -1) return prevUsers;

				// Capture user and position at this moment
				userSnapshot = {
					user: prevUsers[userIndex],
					index: userIndex,
				};

				return prevUsers.filter((item: User) => item.id !== id);
			});

			try {
				const { deleteUser: result } = await deleteUser({
					variables: { id },
				});

				if (!result.success) {
					// Restore user to original position
					if (userSnapshot) {
						setUsers((prevUsers) => {
							const newUsers = [...prevUsers];
							newUsers.splice(userSnapshot!.index, 0, userSnapshot!.user);
							return newUsers;
						});
					}
					logger.error('Error deleting user:', result.error);
				}
			} catch (error) {
				// Rollback: restore user to original position
				if (userSnapshot) {
					setUsers((prevUsers) => {
						const newUsers = [...prevUsers];
						newUsers.splice(userSnapshot!.index, 0, userSnapshot!.user);
						return newUsers;
					});
				}
				logger.error('Error deleting user:', error);
			}
		},
		[deleteUser],
	);

	const handleEditUser = useCallback(
		(id: string) => {
			const user: User | undefined = filteredUsers.find((user: User) => user.id === id);
			user && setEditingUser(user);
		},
		[filteredUsers],
	);

	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (error) {
		return <div>Error: {error as any}</div>;
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
						handleAddUser={handleAddUser}
						handleUpdateUser={handleUpdateUser}
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
