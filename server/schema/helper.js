const getLimitCond = (dbType, count) => {
	switch (dbType) {
		case 'mysql':
			return `LIMT ${count}`;
		case 'oracle':
			return `FETCH FIRST ${count} ROWS ONLY`;
		default:
			return '';
	}
};

module.exports = { getLimitCond };
