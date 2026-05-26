import React, { useEffect, useState, useCallback } from 'react';

import { useWindowEventListener } from '../../hooks';
import { AsyncQueue } from '../../utils/AsyncQueue';
import Button from '../Common/Button';
import { useAsync, useLoadingDelay } from '../../hooks';
import { LoadingBoundary } from '../Common/LoadingBoundary';

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
	const [nextStartId, setNextStartId] = useState(1);

	const fetchArticles = useCallback(async () => {
		const promises = Array.from({ length: ARTICLES_PER_PAGE }, (_, index) =>
			asyncQueue.addToQueue(() => getMockArticle(nextStartId + index)),
		);

		const newArticles = await Promise.all(promises);
		setArticles((prevArticles) => [...prevArticles, ...newArticles]);
	}, [nextStartId]);

	const { run, loading } = useAsync(() => fetchArticles());
	const visible = useLoadingDelay(loading);

	useEffect(() => {
		run();
	}, [nextStartId]);

	const handleLoadMore = () => {
		setNextStartId((prev) => prev + ARTICLES_PER_PAGE);
	};

	useWindowEventListener('scroll', () => {
		const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

		const scrolledToBottom =
			window.innerHeight + scrollTop >=
			document.documentElement.scrollHeight - SCROLL_THRESHOLD;

		if (scrolledToBottom && !loading) {
			handleLoadMore();
		}
	});

	return (
		<div className="article-list">
			{articles.map(({ id, title }) => (
				<div key={id} className="article-item">
					<b>{id}</b>. {title}
				</div>
			))}
			<LoadingBoundary loading={visible} overlay>
				<Button
					onClick={handleLoadMore}
					disabled={loading}
					className="load-more-button"
				>
					Load More
				</Button>
			</LoadingBoundary>
		</div>
	);
};

export default ArticleList;
