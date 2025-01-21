import axios from 'axios';
import { useQuery } from 'react-query';
import { Post } from './types';

export function usePosts() {
	return useQuery<Post[], Error>('posts', async () => {
		const { data } = await axios.get('https://jsonplaceholder.typicode.com/posts');
		return data;
	});
}

export const getPostById = async (id: number): Promise<Post> => {
	const { data } = await axios.get(`https://jsonplaceholder.typicode.com/posts/${id}`);
	return data;
};

export function usePost(postId: number) {
	return useQuery<Post, Error>(['post', postId], () => getPostById(postId), {
		enabled: !!postId,
	});
}
