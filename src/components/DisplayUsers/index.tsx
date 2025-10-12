import { useCallback, useMemo, useState, useEffect, useRef } from 'react';

import { executeQuery, executeMutation, invalidateCache } from '../../graphql/client';
import ScrollToTop from '../Common/ScrollToTopButton';
import { getRandomId } from '../../utils/common';

import { SearchUser } from './SearchUser';
import { UserForm } from './UserForm';
import { UsersList } from './UsersList';

import { GET_USERS, CREATE_USER, UPDATE_USER, DELETE_USER } from './query';

import { createLogger, LogLevel, Logger } from '../../utils/Logger';
import { User, AddUser, UpdateUser, DeleteUser, EditUser } from './types';

const logger: Logger = createLogger('DisplayUsers', {
	level: LogLevel.DEBUG,
});

export default function DisplayUsers() {
	const [users, setUsers] = useState<User[]>([]);
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [editingUser, setEditingUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const [isOnline, setIsOnline] = useState(true);

	const mountedRef = useRef(true);

	// Memoize filtered users
	const filteredUsers = useMemo(() => {
		if (!searchTerm.trim()) return users;
		const searchText = searchTerm.trim().toLowerCase();

		return users.filter((user: User) => {
			const searchFields = [
				user.name.trim().toLowerCase(),
				user.email.trim().toLowerCase(),
				user.age?.toString(),
			];
			return searchFields.some((field) => field?.includes(searchText));
		});
	}, [users, searchTerm]);

	// Load users function
	const loadUsers = useCallback(async (showLoading: boolean = false) => {
		try {
			if (showLoading) {
				setIsLoading(true);
			}
			setError(null);

			logger.info('Loading users...');

			const data = await executeQuery<{ getUsers: User[] }>(
				GET_USERS,
				{},
				30000, // 30 second timeout
				{ retries: 1 },
			);

			if (mountedRef.current && Array.isArray(data?.getUsers)) {
				setUsers(data.getUsers);
				setError(null);
				setIsOnline(true);
				logger.info(`Successfully loaded ${data.getUsers.length} users`);
			}
		} catch (err) {
			const error = err instanceof Error ? err : new Error('Failed to load users');
			logger.error('Error loading users:', error);

			if (mountedRef.current) {
				setError(error);
				setIsOnline(false);
			}
		} finally {
			if (mountedRef.current && showLoading) {
				setIsLoading(false);
			}
		}
	}, []);

	// Initial load
	useEffect(() => {
		loadUsers(true);
	}, [loadUsers]);

	const handleAddUser = useCallback(async (name: string, email: string, age: number) => {
		const tempId = `temp-${getRandomId()}`;
		const optimisticUser = {
			id: tempId,
			name,
			email,
			age,
		};

		// Add optimistic user
		setUsers((prevUsers) => [optimisticUser, ...prevUsers]);

		try {
			logger.info('Creating user:', { name, email, age });

			const result = await executeMutation<{
				createUser: { success: boolean; user: User; error?: string };
			}>(CREATE_USER, {
				variables: { name, email, age },
				timeout: 30000,
			});

			if (!mountedRef.current) return;

			if (result.createUser.success) {
				// Replace the temp user with the real one
				setUsers((prevUsers) =>
					prevUsers.map((user) =>
						user.id === tempId ? result.createUser.user : user,
					),
				);
				setEditingUser(null);
				invalidateCache('getUsers');
				setIsOnline(true);
				logger.info('User created successfully:', result.createUser.user);
			} else {
				// Remove the optimistic user on failure
				setUsers((prevUsers) => prevUsers.filter((user) => user.id !== tempId));
				logger.error('Create user failed:', result.createUser.error);
			}
		} catch (error) {
			if (!mountedRef.current) return;

			// Remove the optimistic user on error
			setUsers((prevUsers) => prevUsers.filter((user) => user.id !== tempId));
			logger.error('Error creating user:', error);

			if (error instanceof Error && error.message.includes('timeout')) {
				setIsOnline(false);
			}
		}
	}, []) as AddUser;

	const handleUpdateUser = useCallback(
		async (id: string, name: string, email: string, age: number) => {
			const updatedUser = { id, name, email, age };
			let originalUserSnapshot: User | null = null;

			// Optimistic update with snapshot capture
			setUsers((prevUsers: User[]): User[] => {
				const userIndex = prevUsers.findIndex((user) => user.id === id);
				if (userIndex === -1) return prevUsers;

				originalUserSnapshot = prevUsers[userIndex];
				return prevUsers.map((item: User) => (item.id === id ? updatedUser : item));
			});

			try {
				logger.info('Updating user:', updatedUser);

				const result = await executeMutation<{
					updateUser: { success: boolean; error?: string };
				}>(UPDATE_USER, {
					variables: updatedUser,
					timeout: 30000,
				});

				if (!mountedRef.current) return;

				if (result.updateUser.success) {
					setEditingUser(null);
					invalidateCache('getUsers');
					setIsOnline(true);
					logger.info('User updated successfully');
				} else {
					// Rollback to original user
					if (originalUserSnapshot) {
						setUsers((prevUsers: User[]): User[] =>
							prevUsers.map((item: User) =>
								item.id === id ? originalUserSnapshot! : item,
							),
						);
					}
					logger.error('Update user failed:', result.updateUser.error);
				}
			} catch (error) {
				if (!mountedRef.current) return;

				logger.error('Error updating user:', error);

				// Rollback to original user
				if (originalUserSnapshot) {
					setUsers((prevUsers: User[]): User[] =>
						prevUsers.map((item: User) =>
							item.id === id ? originalUserSnapshot! : item,
						),
					);
				}

				if (error instanceof Error && error.message.includes('timeout')) {
					setIsOnline(false);
				}
			}
		},
		[],
	) as UpdateUser;

	const handleDeleteUser = useCallback(async (id: string) => {
		let userSnapshot: { user: User; index: number } | null = null;

		// Optimistic delete with position capture
		setUsers((prevUsers: User[]): User[] => {
			const userIndex = prevUsers.findIndex((user) => user.id === id);
			if (userIndex === -1) return prevUsers;

			userSnapshot = {
				user: prevUsers[userIndex],
				index: userIndex,
			};

			return prevUsers.filter((item: User) => item.id !== id);
		});

		try {
			logger.info('Deleting user:', id);

			const result = await executeMutation<{
				deleteUser: { success: boolean; error?: string };
			}>(DELETE_USER, {
				variables: { id },
				timeout: 30000,
			});

			if (!mountedRef.current) return;

			if (!result.deleteUser.success) {
				// Restore user to original position
				if (userSnapshot) {
					setUsers((prevUsers) => {
						const newUsers = [...prevUsers];
						newUsers.splice(userSnapshot!.index, 0, userSnapshot!.user);
						return newUsers;
					});
				}
				logger.error('Delete user failed:', result.deleteUser.error);
			} else {
				invalidateCache('getUsers');
				setIsOnline(true);
				logger.info('User deleted successfully');
			}
		} catch (error) {
			if (!mountedRef.current) return;

			// Rollback: restore user to original position
			if (userSnapshot) {
				setUsers((prevUsers) => {
					const newUsers = [...prevUsers];
					newUsers.splice(userSnapshot!.index, 0, userSnapshot!.user);
					return newUsers;
				});
			}
			logger.error('Error deleting user:', error);

			if (error instanceof Error && error.message.includes('timeout')) {
				setIsOnline(false);
			}
		}
	}, []) as DeleteUser;

	const handleEditUser = useCallback(
		(id: string) => {
			const user: User | undefined = filteredUsers.find((user: User) => user.id === id);
			user && setEditingUser(user);
		},
		[filteredUsers],
	) as EditUser;

	const handleRefresh = useCallback(() => {
		loadUsers(true);
	}, [loadUsers]);

	const handleRetry = useCallback(() => {
		setError(null);
		loadUsers(true);
	}, [loadUsers]);

	// Cleanup
	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	if (isLoading && users.length === 0) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading users...</p>
				</div>
			</div>
		);
	}

	if (error && users.length === 0) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center max-w-md">
					<div className="text-red-500 text-6xl mb-4">⚠️</div>
					<h2 className="text-xl font-semibold text-gray-900 mb-2">
						Connection Error
					</h2>
					<p className="text-gray-600 mb-4">{error.message}</p>
					<button
						onClick={handleRetry}
						className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
					>
						Retry Connection
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-6xl mx-auto px-4 py-8">
				{/* Header with connection status */}
				<div className="text-center mb-8">
					<div className="flex items-center justify-center gap-4 mb-4">
						<h1 className="text-3xl font-bold text-gray-900">📚 All Users</h1>
						<button
							onClick={handleRefresh}
							disabled={isLoading}
							className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
							title="Refresh users"
						>
							🔄
						</button>
					</div>

					<div className="flex justify-center items-center gap-4 text-sm">
						<div
							className={`flex items-center gap-1 ${isOnline ? 'text-green-600' : 'text-red-600'}`}
						>
							<div
								className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}
							></div>
							{isOnline ? 'Connected' : 'Offline'}
						</div>
						<div className="text-gray-500">Auto-refresh: 30s</div>
					</div>
				</div>

				{/* Error banner for non-fatal errors */}
				{error && users.length > 0 && (
					<div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
						<div className="flex items-center justify-between">
							<div className="flex items-center">
								<div className="text-yellow-400 mr-2">⚠️</div>
								<p className="text-yellow-800">
									Connection issues detected. Some features may not work
									properly.
								</p>
							</div>
							<button
								onClick={handleRetry}
								className="text-yellow-800 hover:text-yellow-900 underline text-sm"
							>
								Retry
							</button>
						</div>
					</div>
				)}

				{/* Loading indicator for refreshes */}
				{isLoading && users.length > 0 && (
					<div className="text-center mb-4">
						<div className="inline-flex items-center text-gray-600">
							<div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full mr-2"></div>
							Refreshing...
						</div>
					</div>
				)}

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
