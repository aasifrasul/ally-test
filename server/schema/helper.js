const GenericDBConnection = require('../dbClients/GenericDBConnection');

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

const getDBInstance = async (dbType) => {
	const genericInstance = await GenericDBConnection.getInstance(dbType);
	return genericInstance.getDBInstance();
};

module.exports = { getLimitCond, getDBInstance };
