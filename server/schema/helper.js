const GenericDBConnection = require('../dbClients/GenericDBConnection');

const getLimitCond = (currentDB, count) => {
	switch (currentDB) {
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

const getDBInstance = async (currentDB) => {
	const genericInstance = await GenericDBConnection.getInstance(currentDB);
	return genericInstance.getDBInstance();
};

module.exports = { getLimitCond, getDBInstance };
