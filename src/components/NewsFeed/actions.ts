import { Dispatch } from 'redux';

import { apiClient } from './apiClient';

import { ApiResponse, DispatchAction } from './types';

export const GET_NEWS_FEED = 'GET_NEWS_FEED';

export const getNewsFeed =
	() =>
	async (dispatch: Dispatch<DispatchAction>): Promise<void> => {
		try {
			const res: ApiResponse = await apiClient.get(
				'top-headlines?language=en&category=business',
			);
			if (res.status === 200) {
				dispatch({
					type: GET_NEWS_FEED,
					payload: res?.data?.articles,
				});
			} else {
				console.warn('Something went wrong');
			}
		} catch (error) {
			console.error(error);
		}
	};
