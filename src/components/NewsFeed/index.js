import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getNewsFeed } from './actions';

import NewsItem from './NewsItem';

const NewsFeed = () => {
	const { newsFeed } = useSelector((state) => state.feedReducer);
	const dispatch = useDispatch();

	useEffect(() => {
		dispatch(getNewsFeed());
	}, [dispatch]);

	return (
		<div>
			{newsFeed.map((newsItem, index) => (
				<NewsItem key={index} newsItem={newsItem} />
			))}
		</div>
	);
};

export default NewsFeed;
