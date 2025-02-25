import React, { useEffect, useState, useCallback } from 'react';

import { useEventListener } from '../../hooks/EventListeners';
import { AsyncQueue } from '../../utils/AsyncQueue';

type Article = {
	id: number;
	title: string;
};

const dummyTitleStr =
	'Lorem ipsum dolor sit amet consectetur adipisicing elit. Totam distinctio dolorum illo, impedit reprehenderit, ipsam ipsum debitis non incidunt nostrum ullam esse porro id praesentium.';

const ARTICLES_PER_PAGE = 10;
const SCROLL_THRESHOLD = 100;

function getMockArticle(id: number): Promise<Article> {
	const max = Math.floor(Math.random() * dummyTitleStr.length);
	const min = Math.floor(Math.random() * max);
	const title = dummyTitleStr.slice(min, max);
	const delay = Math.floor(Math.random() * 2000);
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve({ id, title });
		}, delay);
	});
}

// Create queue instance outside component to persist between renders
const asyncQueue = new AsyncQueue<Article>();

const ArticleList: React.FC = () => {
	const [articles, setArticles] = useState<Article[]>([]);
	const [loading, setLoading] = useState(false);
	const [nextStartId, setNextStartId] = useState(1);

	const fetchArticles = useCallback(async () => {
		if (loading) return;

		setLoading(true);

		try {
			const promises = Array.from({ length: ARTICLES_PER_PAGE }, (_, index) =>
				asyncQueue.addToQueue(() => getMockArticle(nextStartId + index)),
			);

			const newArticles = await Promise.all(promises);
			setArticles((prevArticles) => [...prevArticles, ...newArticles]);

			// Optional: Set hasMore to false if no more articles
			// if (newArticles.length < ARTICLES_PER_PAGE) setHasMore(false);
		} catch (error) {
			console.error('Error fetching articles:', error);
		} finally {
			setLoading(false);
		}
	}, [loading, nextStartId]);

	const handleLoadMore = () => setNextStartId(articles.length + 1);

	const handleScroll = useCallback(() => {
		const scrolledToBottom =
			window.innerHeight + document.documentElement.scrollTop >=
			document.documentElement.offsetHeight - SCROLL_THRESHOLD;

		if (scrolledToBottom && !loading) {
			handleLoadMore();
		}
	}, [handleLoadMore, loading]);

	useEffect(() => {
		void fetchArticles();
	}, []);

	useEventListener('scroll', handleScroll, window);

	return (
		<div className="article-list">
			{articles.map(({ id, title }) => (
				<div key={id} className="article-item">
					<b>{id}</b>. {title}
				</div>
			))}
			{loading && <div className="loading">Loading...</div>}
			{!loading && (
				<button
					onClick={handleLoadMore}
					disabled={loading}
					className="load-more-button"
				>
					Load More
				</button>
			)}
		</div>
	);
};

export default ArticleList;
