class MyMap {
	constructor() {
		this.keys = [];
		this.hash = {}; // Store value and index
	}

	has(key) {
		return key in this.hash;
	}

	get(key) {
		return this.has(key) ? this.hash[key].value : undefined;
	}

	set(key, value) {
		let index;
		if (!this.has(key)) {
			index = this.keys.push(key) - 1;
		} else {
			index = this.hash[key].index; //Get the correct index when updating existing keys
		}

		this.hash[key] = { value, index };
	}

	delete(key) {
		if (!this.has(key)) {
			return false;
		}

		const { index } = this.hash[key];
		delete this.hash[key];
		this.keys.splice(index, 1);

		//Crucially important: update indices of other elements
		for (let i = index; i < this.keys.length; i++) {
			this.hash[this.keys[i]].index = i;
		}
		return true;
	}

	*keys() {
		yield* this.keys;
	}

	*values() {
		for (const key of this.keys) {
			yield this.hash[key].value;
		}
	}

	*entries() {
		for (const key of this.keys) {
			yield [key, this.hash[key].value];
		}
	}

	[Symbol.iterator]() {
		// Corrected: use [Symbol.iterator]() directly
		return this.entries(); // Use entries() generator
	}

	get size() {
		return this.keys.length;
	}

	clear() {
		this.keys = [];
		this.hash = {};
	}
}

const myMap = new MyMap();
