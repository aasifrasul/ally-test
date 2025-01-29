import React, { useState, useEffect } from 'react';

import { Storage, StorageType } from '../utils/Storage';

const storage = new Storage(StorageType.SESSION_STORAGE);
storage.initialize();

const useToken = () => {
	const [token, setToken] = useState<string | null>(null);

	useEffect(() => {
		const getToken = async () => {
			const token: string | null = await storage.getItem('token');
			setToken(token);
		};

		getToken();
	}, []);

	useEffect(() => {
		if (token) {
			storage.setItem('token', token);
		}
	}, [token]);

	return {
		setToken,
		token,
	};
};

export default useToken;
