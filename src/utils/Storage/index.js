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
		getItem: hashMap?.get.bind(hashMap),
		setItem: hashMap?.set.bind(hashMap),
		removeItem: hashMap?.delete.bind(hashMap),
		contains: hashMap?.has.bind(hashMap),
	}
};

class Storage {
	constructor(storage = 'localStorage') {
		this.storage = storage;

		if (this.storage === 'map') {
			hashMap = new Map();
		}
	}

	getItem(key) {
		return new Promise((resolve, reject) => {
			try {
				const data = storgaeMappings[this.storage]?.getItem(key);
				resolve(storgaeMappings[this.storage].stringify ? JSON.parse(data) : data);
			} catch (e) {
				reject(new Error('Error ', e));
			}
		});
	}

	setItem(key, value) {
		return new Promise((resolve, reject) => {
			try {
				const data = storgaeMappings[this.storage]?.setItem(
					key,
					storgaeMappings[this.storage].stringify ? JSON.stringify(value) : value
				);
				resolve();
			} catch (e) {
				reject(new Error('Error ', e));
			}
		});
	}

	removeItem(key) {
		return new Promise((resolve, reject) => {
			try {
				const data = storgaeMappings[this.storage]?.removeItem(key);
				resolve(data);
			} catch (e) {
				reject(new Error('Error ', e));
			}
		});
	}

	contains(key) {
		return storgaeMappings[this.storage]?.contains(key);
	}
}

module.exports = { Storage };
