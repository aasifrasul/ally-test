import { DBType } from '../types';
import { GenericDBConnection } from '../dbClients/GenericDBConnection';

const getLimitCond = (currentDB: DBType, count: number): string => {
	switch (currentDB) {
		case 'mysql':
			return `LIMIT ${count}`;
		case 'oracle':
			return `FETCH FIRST ${count} ROWS ONLY`;
		case 'postgres':
			return `FETCH FIRST ${count} ROWS ONLY`;
		default:
			return '';
	}
};

const getDBInstance = async (currentDB: DBType) => {
	const genericInstance = await GenericDBConnection.getInstance(currentDB);
	return genericInstance.getDBInstance();
};

export { getLimitCond, getDBInstance };
