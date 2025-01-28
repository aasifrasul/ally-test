import React from 'react';

import type { NewsItem } from './types';

const NewsItem: React.FC<NewsItem> = ({
	title,
	description,
	author,
	publishedAt,
	urlToImage,
	url,
}) => {
	return (
		<div>
			<h2>{title}</h2>
			<p>{description}</p>
			<p>Author: {author}</p>
			<p>Date: {publishedAt}</p>
			{urlToImage && <img src={urlToImage} alt="News" />}
			<a href={url}>Read More</a>
		</div>
	);
};

export default NewsItem;
