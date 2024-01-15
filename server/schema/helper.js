const getLimitCond = (dbType, count) => {
	switch (dbType) {
		case 'mysql':
			return `LIMIT ${count}`;
		case 'oracle':
			return `FETCH FIRST ${count} ROWS ONLY`;
		case 'postgresql':
			return `FETCH FIRST ${count} ROWS ONLY`;
		default:
			return '';
	}
};

module.exports = { getLimitCond };
