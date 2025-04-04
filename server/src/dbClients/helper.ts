import { DBType } from '../types';
import {
	GenericDBConnection,
	type DBInstance,
	type ExecuteQueryType,
} from './GenericDBConnection';

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

const getGenericDBInstance = async (currentDB: DBType): Promise<GenericDBConnection> => {
	const genericInstance = await GenericDBConnection.getInstance(currentDB);

	if (!genericInstance) {
		throw new Error(`Failed to get DB instance for ${currentDB}`);
	}

	return genericInstance;
};

const getDBInstance = async (currentDB: DBType): Promise<DBInstance | null> => {
	const genericInstance = await getGenericDBInstance(currentDB);
	return genericInstance.getDBInstance();
};

export {
	GenericDBConnection,
	getLimitCond,
	getDBInstance,
	getGenericDBInstance,
	type DBInstance,
	type ExecuteQueryType,
};
