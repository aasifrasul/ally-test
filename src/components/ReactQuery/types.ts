export interface Post {
	id: number;
	title: string;
	body: string;
}

export interface PostsProps {
	setPostId: (id: number) => void;
}

export interface PostProps extends PostsProps {
	postId: number;
}
