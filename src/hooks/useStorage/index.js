let hashMap;

const storgaeMappings = {
	localStorage: {
		stringify: true,
		getItem: window.localStorage.getItem.bind(window.localStorage),
		setItem: window.localStorage.setItem.bind(window.localStorage),
		removeItem: window.localStorage.removeItem.bind(window.localStorage),
	},
	sessionStorage: {
		stringify: true,
		getItem: window.sessionStorage.getItem.bind(window.localStorage),
		setItem: window.sessionStorage.setItem.bind(window.localStorage),
		removeItem: window.sessionStorage.removeItem.bind(window.localStorage),
	},
	map: {
		getItem: hashMap.get.bind(hashMap),
		setItem: hashMap.set.bind(hashMap),
		removeItem: hashMap.delete.bind(hashMap),
		contains: hashMap.has.bind(hashMap),
	},
};

function useStorage(storage = 'localStorage') {
	if (storage === 'map') {
		hashMap = new Map();
	}

	function getItem(key) {
		return new Promise((resolve, reject) => {
			try {
				const data = storgaeMappings[storage]?.getItem(key);
				resolve(storgaeMappings[storage].stringify ? JSON.parse(data) : data);
			} catch (e) {
				reject(new Error('Error ', e));
			}
		});
	}

	function setItem(key, value) {
		return new Promise((resolve, reject) => {
			try {
				const data = storgaeMappings[storage]?.setItem(
					key,
					storgaeMappings[storage].stringify ? JSON.stringify(value) : value,
				);
				resolve();
			} catch (e) {
				reject(new Error('Error ', e));
			}
		});
	}

	function removeItem(key) {
		return new Promise((resolve, reject) => {
			try {
				const data = storgaeMappings[storage]?.removeItem(key);
				resolve(data);
			} catch (e) {
				reject(new Error('Error ', e));
			}
		});
	}

	function contains(key) {
		return storgaeMappings[storage]?.contains(key);
	}

	return {
		hashMap,
		getItem,
		setItem,
		removeItem,
		contains,
	};
}

export default useStorage;
