import React, { useEffect, useState, useRef } from 'react';

import AsyncQueue from '../../utils/AsyncQueue';

const dummyTitleStr =
	'Lorem ipsum dolor sit amet consectetur adipisicing elit. Totam distinctio dolorum illo, impedit reprehenderit, ipsam ipsum debitis non incidunt nostrum ullam esse porro id praesentium.';

function getMockArticle(id) {
	/** --------- 1 -----------
	 * (i) Should return an article: {id: string, title: string} for given id and use dummyTitleStr parts for creating random titles
	 * (ii) Wrap the returned object in a promise which resolves in a random time interval between 0 - 2 seconds
	 */
	let max = Math.floor(Math.random() * dummyTitleStr.length);
	let min = Math.floor(Math.random() * dummyTitleStr.length);
	max = Math.max(max, min);
	min = Math.min(max, min);
	const title = dummyTitleStr.slice(min / 2, max);
	const delay = Math.floor(Math.random() * 5) * 1000;
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve({
				id,
				title,
			});
		}, delay);
	});
}

const asyncQueue = new AsyncQueue();

const articleIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const ArticleList = () => {
	const [articles, setArticles] = useState([]);
	const didMount = useRef(false);

	useEffect(() => {
		if (!didMount.current) {
			articleIds.forEach((id) =>
				asyncQueue
					.enqueue(getMockArticle(id))
					.then((item) => setArticles((items) => [...items, item]))
			);
			didMount.current = true;
		}
	}, []);

	const html = articles.map((id) => {
		return (
			<div key={id.id}>
				<b>{id.id}</b>.{id.title}
			</div>
		);
	});
	/** --------- 2 -----------
	 * (i) Render a list of first 10 articles showing ID and title
	 * (ii) Render in sequence from top to bottom rather than randomly (as they would because of random timeouts)
	 * (iii) Add a next button that adds 10 more articles in the bottom. Can you use this to implement infinite scroll?
	 */
	return <div>{html}</div>;
};

export default ArticleList;
