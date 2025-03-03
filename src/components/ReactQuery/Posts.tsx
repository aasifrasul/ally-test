import { JSX } from 'react';
import { useQueryClient } from 'react-query';
import { usePosts } from './helpers';
import { PostsProps } from './types';

export function Posts({ setPostId }: PostsProps): JSX.Element {
	const queryClient = useQueryClient();
	const { status, data, error, isFetching } = usePosts();

	return (
		<div>
			<h1>Posts</h1>
			<div>
				{status === 'loading' ? (
					'Loading...'
				) : status === 'error' ? (
					<span>Error: {error.message}</span>
				) : (
					<>
						<div>
							{data!.map((post) => (
								<p key={post.id}>
									<a
										onClick={(e) => {
											e.preventDefault();
											setPostId(post.id);
										}}
										href=""
										style={
											queryClient.getQueryData(['post', post.id])
												? {
														fontWeight: 'bold',
														color: 'green',
													}
												: {}
										}
									>
										{post.title}
									</a>
								</p>
							))}
						</div>
						<div>{isFetching ? 'Background Updating...' : ' '}</div>
					</>
				)}
			</div>
		</div>
	);
}
