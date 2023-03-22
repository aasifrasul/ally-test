import React from 'react';

const NewsItem = ({ newsItem }) => {
	return (
		<div>
			<h2>{newsItem.title}</h2>
			<p>{newsItem.description}</p>
			<p>Author: {newsItem.author}</p>
			<p>Date: {newsItem.publishedAt}</p>
			{newsItem.urlToImage && <img src={newsItem.urlToImage} alt="News" />}
			<a href={newsItem.url}>Read More</a>
		</div>
	);
};

export default NewsItem;
