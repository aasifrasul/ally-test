function getRandomInt(min = 1000*1000, max = 2000*1000) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min) + min);
}

export { getRandomInt };
