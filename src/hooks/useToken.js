import React, { useState } from 'react';

import { Storage } from '../utils/Storage';

const storage = new Storage('sessionStorage');

const useToken = () => {
	const [token, setToken] = useState(null);

	const getToken = async () => {
		const token = await storage.getItem('token');
		setToken(token);
	};

	useState(() => {
		getToken();
	}, []);

	useState(() => {
		storage.setItem('token', token);
	}, [token]);

	return {
		setToken,
		token,
	};
};

export default useToken;
