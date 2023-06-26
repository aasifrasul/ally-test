import React from 'react';

function useStorage(storage = 'localStorage') {
	if (!(storage in window)) {
		throw new Error(`${storage} is not available`);
	}
	function getItem(key) {
		return new Promise((resolve, reject) => {
			try {
				const data = window[storage]?.getItem(key);
				resolve(JSON.parse(data));
			} catch (e) {
				reject(new Error('Error ', e));
			}
		});
	}
	function setItem(key, value) {
		return new Promise((resolve, reject) => {
			try {
				const data = window[storage]?.setItem(key, JSON.stringify(value));
				resolve();
			} catch (e) {
				reject(new Error('Error ', e));
			}
		});
	}
	function removeItem(key) {
		return new Promise((resolve, reject) => {
			try {
				const data = window[storage]?.removeItem(key);
				resolve(data);
			} catch (e) {
				reject(new Error('Error ', e));
			}
		});
	}
	return {
		getItem,
		setItem,
		removeItem,
	};
}

export default useStorage;
