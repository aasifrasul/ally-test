import { JSX } from 'react';
import { usePost } from './helpers';
import { PostProps } from './types';

export function Post({ postId, setPostId }: PostProps): JSX.Element {
	const { status, data, error, isFetching } = usePost(postId);

	return (
		<div>
			<div>
				<a
					onClick={(e) => {
						e.preventDefault();
						setPostId(-1);
					}}
					href=""
				>
					Back
				</a>
			</div>
			{!postId || status === 'loading' ? (
				'Loading...'
			) : status === 'error' ? (
				<span>Error: {error.message}</span>
			) : (
				<>
					<h1>{data!.title}</h1>
					<div>
						<p>{data!.body}</p>
					</div>
					<div>{isFetching ? 'Background Updating...' : ' '}</div>
				</>
			)}
		</div>
	);
}
