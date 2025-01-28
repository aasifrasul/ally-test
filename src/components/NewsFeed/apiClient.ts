import axios from 'axios';
const BASE_URL = 'https://newsapi.org/v2/';

export const apiClient = axios.create({
	baseURL: BASE_URL,
	timeout: 10000,
	headers: {
		'X-Api-key': 'd85ffa9e47de4423af6a356f3f48d0dc',
	},
});
