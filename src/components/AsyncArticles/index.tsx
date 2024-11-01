import React, { useEffect, useState, useCallback } from 'react';
import { AsyncQueue } from '../../utils/AsyncQueue';

type Article = {
	id: number;
	title: string;
};

const dummyTitleStr =
	'Lorem ipsum dolor sit amet consectetur adipisicing elit. Totam distinctio dolorum illo, impedit reprehenderit, ipsam ipsum debitis non incidunt nostrum ullam esse porro id praesentium.';

function getMockArticle(id: number): Promise<Article> {
	const max = Math.floor(Math.random() * dummyTitleStr.length);
	const min = Math.floor(Math.random() * max);
	const title = dummyTitleStr.slice(min, max);
	const delay = Math.floor(Math.random() * 2000); // 0-2 seconds
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve({ id, title });
		}, delay);
	});
}

const asyncQueue = new AsyncQueue<Article>();

const ArticleList: React.FC = () => {
	const [articles, setArticles] = useState<Article[]>([]);
	const [loading, setLoading] = useState(false);
	const [page, setPage] = useState(1);

	const fetchArticles = useCallback((startId: number, count: number) => {
		setLoading(true);
		const promises = Array.from({ length: count }, (_, index) =>
			asyncQueue.addToQueue(() => getMockArticle(startId + index)),
		);

		Promise.all(promises).then((newArticles) => {
			setArticles((prevArticles) => [...prevArticles, ...newArticles]);
			setLoading(false);
		});
	}, []);

	useEffect(() => {
		fetchArticles(1, 10);
	}, [fetchArticles]);

	const handleLoadMore = () => {
		const nextStartId = articles.length + 1;
		fetchArticles(nextStartId, 10);
		setPage((prevPage) => prevPage + 1);
	};

	const handleScroll = useCallback(() => {
		if (
			window.innerHeight + document.documentElement.scrollTop >=
			document.documentElement.offsetHeight - 100
		) {
			handleLoadMore();
		}
	}, [handleLoadMore]);

	useEffect(() => {
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, [handleScroll]);

	return (
		<div>
			{articles.map((article) => (
				<div key={article.id}>
					<b>{article.id}</b>. {article.title}
				</div>
			))}
			{loading && <div>Loading...</div>}
			<button onClick={handleLoadMore} disabled={loading}>
				Load More
			</button>
		</div>
	);
};

export default ArticleList;
