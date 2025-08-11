import { useSubscription } from '../../graphql/hooks';

interface UseSubscriptionResult<T> {
	data: T | null;
	isLoading: boolean;
	error: Error | null;
}

const USER_CREATED_SUBSCRIPTION = `
  subscription {
	userCreated {
	  id
	  name
	  email
	}
  }
`;

export default function GraphqlSubscription() {
	const { data, isLoading, error } = useSubscription(USER_CREATED_SUBSCRIPTION, {
		onSubscriptionData: ({ subscriptionData }) => {
			console.log('New user:', subscriptionData.data.userCreated);
		},
	});

	return (
		<div>
			{isLoading && <div>Listening for new users...</div>}
			{error && <div>Subscription error: {error.message}</div>}
			{data && <div>New user created: {data.userCreated.name}</div>}
		</div>
	);
}
