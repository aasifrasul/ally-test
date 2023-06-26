import React, { useState } from 'react';

import useStorage from './useStorage';

const useToken = () => {
	const { getItem, setItem } = useStorage('sessionStorage');
	const getToken = () => {
		const userToken = getItem('token');
		return userToken?.token;
	};

	const [token, setToken] = useState(getToken());
	const saveToken = (userToken) => {
		setItem('token', userToken);
		setToken(userToken?.token);
	};
	return {
		setToken: saveToken,
		token,
	};
};

export default useToken;
