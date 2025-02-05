import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';
import { UnknownAction } from 'redux';
import { getNewsFeed } from './actions';
import Item from './Item';
import { NewsItem } from './types';
import { api } from './apiClient';

const NewsFeed: React.FC = () => {
	const { data, error, isLoading } = api.useGetNewsFeedQuery({
		language: 'en',
		category: 'business',
	});

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div>Error occurred</div>;

	return (
		<div>
			{data.articles!.map((newsItem: NewsItem, index: number) => (
				<Item key={index} {...newsItem} />
			))}
		</div>
	);
};

export default NewsFeed;
