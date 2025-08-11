import { useState, useEffect, useCallback, useRef } from 'react';

import {
	executeQuery,
	subscribeWithCallback,
	executeMutation,
	invalidateCache,
	updateCache,
} from './client';

import {
	QueryOptions,
	QueryResult,
	LazyQueryOptions,
	LazyQueryExecute,
	LazyQueryResult,
	MutationHookOptions,
	MutationExecute,
	MutationResult,
	SubscriptionOptions,
	SubscriptionResult,
	SubscriptionEventHandler,
} from './types';

export function useQuery<T = any>(query: string, options: QueryOptions = {}): QueryResult<T> {
	const {
		variables,
		skip = false,
		cache = true,
		cacheTTL,
		timeout = 5000,
		pollInterval,
		onCompleted,
		onError,
	} = options;

	const [data, setData] = useState<T | null>(null);
	const [isLoading, setIsLoading] = useState(!skip);
	const [error, setError] = useState<Error | null>(null);

	const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const mountedRef = useRef(true);

	const executeQueryInternal = useCallback(
		async (vars?: Record<string, any>) => {
			if (skip || !mountedRef.current) return null;

			setIsLoading(true);
			setError(null);

			try {
				const result = await executeQuery<T>(query, vars || variables, timeout, {
					cache,
					cacheTTL,
				});

				if (mountedRef.current) {
					setData(result);
					setIsLoading(false);
					onCompleted?.(result);
				}

				return result;
			} catch (err) {
				const errorObj = err instanceof Error ? err : new Error('Query failed');

				if (mountedRef.current) {
					setError(errorObj);
					setIsLoading(false);
					onError?.(errorObj);
				}

				throw errorObj;
			}
		},
		[query, variables, skip, cache, cacheTTL, timeout, onCompleted, onError],
	);

	const refetch = useCallback(
		async (newVariables?: Record<string, any>) => {
			return executeQueryInternal(newVariables);
		},
		[executeQueryInternal],
	);

	const startPolling = useCallback(
		(interval: number) => {
			if (pollIntervalRef.current) {
				clearInterval(pollIntervalRef.current);
			}

			pollIntervalRef.current = setInterval(() => {
				executeQueryInternal();
			}, interval);
		},
		[executeQueryInternal],
	);

	const stopPolling = useCallback(() => {
		if (pollIntervalRef.current) {
			clearInterval(pollIntervalRef.current);
			pollIntervalRef.current = null;
		}
	}, []);

	const updateQuery = useCallback((updater: (prev: T | null) => T | null) => {
		setData((prev) => updater(prev));
	}, []);

	// Initial query execution
	useEffect(() => {
		if (!skip) {
			executeQueryInternal();
		}
	}, [executeQueryInternal, skip]);

	// Handle polling
	useEffect(() => {
		if (pollInterval && !skip) {
			startPolling(pollInterval);
		}

		return () => stopPolling();
	}, [pollInterval, skip, startPolling, stopPolling]);

	// Cleanup on unmount
	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
			stopPolling();
		};
	}, [stopPolling]);

	return {
		data,
		isLoading,
		error,
		refetch,
		startPolling,
		stopPolling,
		updateQuery,
	};
}

// ===== useLazyQuery Hook =====

export function useLazyQuery<T = any>(
	query: string,
	options: LazyQueryOptions = {},
): [LazyQueryExecute<T>, LazyQueryResult<T>] {
	const [data, setData] = useState<T | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [called, setCalled] = useState(false);

	const execute = useCallback(
		async (execOptions?: { variables?: Record<string, any> }) => {
			setCalled(true);
			setIsLoading(true);
			setError(null);

			try {
				const result = await executeQuery<T>(
					query,
					execOptions?.variables || options.variables,
					options.timeout || 5000,
					{ cache: options.cache, cacheTTL: options.cacheTTL },
				);

				setData(result);
				setIsLoading(false);
				options.onCompleted?.(result);
				return result;
			} catch (err) {
				const errorObj = err instanceof Error ? err : new Error('Query failed');
				setError(errorObj);
				setIsLoading(false);
				options.onError?.(errorObj);
				return null;
			}
		},
		[query, options],
	);

	return [execute, { data, isLoading, error, called }];
}

// ===== useMutation Hook (Optional - for stateful mutations) =====

export function useMutation<T = any>(
	mutation: string,
	options: MutationHookOptions<T> = {},
): [MutationExecute<T>, MutationResult<T>] {
	const [data, setData] = useState<T | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const execute = useCallback(
		async (execOptions?: {
			variables?: Record<string, any>;
			optimisticResponse?: any;
			refetchQueries?: Array<{
				query: string;
				variables?: Record<string, any>;
			}>;
		}) => {
			setIsLoading(true);
			setError(null);

			try {
				const result = await executeMutation<T>(mutation, {
					...execOptions,
					onCompleted: (data) => {
						setData(data);
						setIsLoading(false);
						options.onCompleted?.(data);
					},
					onError: (err) => {
						setError(err);
						setIsLoading(false);
						options.onError?.(err);
						throw err;
					},
				});

				return result;
			} catch (err) {
				// Error handling is done in executeMutation
				throw err;
			}
		},
		[mutation, options],
	);

	const reset = useCallback(() => {
		setData(null);
		setIsLoading(false);
		setError(null);
	}, []);

	return [execute, { data, isLoading, error, reset }];
}

// ===== useSubscription Hook =====

export function useSubscription<T = any>(
	subscription: string,
	options: SubscriptionOptions<T> = {},
): SubscriptionResult<T> {
	const {
		variables,
		skip = false,
		onSubscriptionData,
		onSubscriptionComplete,
		onError,
	} = options;

	const [data, setData] = useState<T | null>(null);
	const [isLoading, setIsLoading] = useState(!skip);
	const [error, setError] = useState<Error | null>(null);

	const handleData = useCallback(
		(newData: T) => {
			setData(newData);
			setIsLoading(false);
			setError(null);
			onSubscriptionData?.({ subscriptionData: { data: newData } });
		},
		[onSubscriptionData],
	);

	const handleError = useCallback(
		(err: any) => {
			const errorObj = err instanceof Error ? err : new Error('Subscription failed');
			setError(errorObj);
			setIsLoading(false);
			onError?.(errorObj);
		},
		[onError],
	);

	const handleComplete = useCallback(() => {
		setIsLoading(false);
		onSubscriptionComplete?.();
	}, [onSubscriptionComplete]);

	useEffect(() => {
		if (skip) {
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		setError(null);
		setData(null);

		// For now, we'll use the subscription without variables
		// You might want to extend your subscribeWithCallback to support variables
		const unsubscribe = subscribeWithCallback<T>(subscription, {
			onData: handleData,
			onError: handleError,
			onComplete: handleComplete,
		} as SubscriptionEventHandler<T>);

		return () => {
			unsubscribe();
		};
	}, [subscription, variables, skip, handleData, handleError, handleComplete]);

	return { data, isLoading, error };
}

// ===== Cache Management Hooks =====

export function useInvalidateCache() {
	return useCallback((pattern?: string) => {
		invalidateCache(pattern);
	}, []);
}

export function useUpdateCache() {
	return useCallback((query: string, variables: any, updater: (data: any) => any) => {
		updateCache(query, variables, updater);
	}, []);
}

// ===== Usage Examples =====

/*
// Query Example
const GET_USERS = `
  query GetUsers($limit: Int) {
    users(limit: $limit) {
      id
      name
      email
    }
  }
`;

function UsersComponent() {
  const { data, isLoading, error, refetch } = useQuery(GET_USERS, {
    variables: { limit: 10 },
    pollInterval: 5000, // Poll every 5 seconds
    onCompleted: (data) => console.log('Users loaded:', data),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.users?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}

// Lazy Query Example
function SearchComponent() {
  const [searchUsers, { data, isLoading, error }] = useLazyQuery(GET_USERS);

  const handleSearch = () => {
    searchUsers({ variables: { limit: 5 } });
  };

  return (
    <div>
      <button onClick={handleSearch}>Search Users</button>
      {isLoading && <div>Searching...</div>}
      {data && <div>Found {data.users.length} users</div>}
    </div>
  );
}

// Direct Mutation Example (Recommended for event handlers)
const CREATE_USER = `
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      name
      email
    }
  }
`;

function CreateUserForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    
    try {
      const result = await executeMutation(CREATE_USER, {
        variables: { input: formData },
        optimisticResponse: {
          createUser: {
            id: 'temp-id',
            ...formData,
          },
        },
        refetchQueries: [{ query: GET_USERS, variables: { limit: 10 } }],
        onCompleted: (data) => {
          console.log('User created:', data.createUser);
        },
        onError: (error) => {
          console.error('Failed to create user:', error);
        }
      });
      
      // Handle success
      alert('User created successfully!');
    } catch (error) {
      // Error already handled in onError
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}

// Mutation Hook Example (For stateful mutations)
function CreateUserFormWithHook() {
  const [createUser, { isLoading, error, data }] = useMutation(CREATE_USER, {
    onCompleted: (data) => {
      console.log('User created:', data.createUser);
    },
  });

  const handleSubmit = async (formData) => {
    try {
      await createUser({
        variables: { input: formData },
        refetchQueries: [{ query: GET_USERS, variables: { limit: 10 } }],
      });
    } catch (err) {
      // Error is already set in the hook state
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create User'}
      </button>
      {error && <div>Error: {error.message}</div>}
      {data && <div>Success! Created user: {data.createUser.name}</div>}
    </form>
  );
}

// Subscription Example
const USER_CREATED_SUBSCRIPTION = `
  subscription {
    userCreated {
      id
      name
      email
    }
  }
`;

function LiveUsersComponent() {
  const { data, isLoading, error } = useSubscription(USER_CREATED_SUBSCRIPTION, {
    onSubscriptionData: ({ subscriptionData }) => {
      console.log('New user:', subscriptionData.data.userCreated);
    },
  });

  return (
    <div>
      {isLoading && <div>Listening for new users...</div>}
      {error && <div>Subscription error: {error.message}</div>}
      {data && (
        <div>
          New user created: {data.userCreated.name}
        </div>
      )}
    </div>
  );
}
*/
