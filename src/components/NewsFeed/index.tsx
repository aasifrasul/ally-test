import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';
import { UnknownAction } from 'redux';
import { getNewsFeed } from './actions';
import Item from './Item';
import { NewsItem } from './types';

const NewsFeed: React.FC = () => {
	const { newsFeed }: { newsFeed: NewsItem[] } = useSelector((state: any) => state.feed);
	const dispatch: ThunkDispatch<any, any, UnknownAction> = useDispatch();

	useEffect(() => {
		dispatch(getNewsFeed());
	}, [dispatch]);

	return (
		<div>
			{newsFeed.map((newsItem, index) => (
				<Item key={index} {...newsItem} />
			))}
		</div>
	);
};

export default NewsFeed;
