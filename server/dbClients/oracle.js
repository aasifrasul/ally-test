const oracledb = require('oracledb');

const { logger } = require('../Logger');

async function createConnection() {
	let connection;

	try {
		connection = await oracledb.getConnection({
			user: 'zportal',
			password: 'zportal',
			connectionString: 'dft11-t13-adb01.lab.nordigy.ru:1521/devf13ams_db',
		});
		logger.info('Successfully connected to Oracle Database');
	} catch (err) {
		logger.warn(`Database connection Error: ${err.stack}`);
	}

	return connection;
}

async function closeConnection(connection) {
	if (connection) {
		try {
			await connection.close();
		} catch (err) {
			logger.error(err);
		}
	}
}

async function executeQuery(query) {
	logger.info(`query -> ${query}`);
	const connection = await createConnection();
	try {
		const result = await connection.execute(query, [], {
			resultSet: true,
			outFormat: oracledb.OUT_FORMAT_OBJECT,
		});

		if (result.resultSet) {
			const rs = result.resultSet;
			let row,
				rows = [];
			while ((row = await rs.getRow())) {
				rows.push(row);
			}
			await rs.close();
			logger.info(`rows -> ${JSON.stringify(rows)}`);
			return rows;
		} else {
			connection.commit();
			logger.info(`Result -> ${JSON.stringify(result)}`);
			return result.rowsAffected > 0;
		}
	} catch (err) {
		logger.error(`executeQuery failed -> ${JSON.stringify(err.stack)}`);
	} finally {
		closeConnection(connection);
	}
}

module.exports = { executeQuery };

/**
 * create table TEST_USERS ( "id" number generated always as identity, "firstName" varchar2(4000), "lastName" varchar2(4000), "age" number, primary key ("id"));
 * 
 * {
 "query": "mutation createUser($firstName: String!, $lastName: String!, $age: Int!) { createUser(firstName: $firstName, lastName: $lastName, age: $age) }",
 "variables": {
   "firstName": "Aasif",
   "lastName": "Rasul",
   "age": 40
 }
}
 * 
 * {
  "query": "{ getUser(id: 1) {id, firstName, lastName, age} }"
}
 * 
 * 
 * {
  "query": "{ getUsers {id, firstName, lastName, age} }"
}
 * 
 * 
 * {
 "query": "mutation UpdateUser($id: ID!, $firstName: String, $lastName: String, $age: Int) { updateUser(id: $id, firstName: $firstName, lastName: $lastName, age: $age) }",
 "variables": {
   "id": "1",
   "firstName": "John",
   "lastName": "Doe",
   "age": 30
 }
}
 * 
 * 
 * 
 * {
 "query": "mutation deleteUser($id: ID!) { deleteUser(id: $id) }",
 "variables": {
   "id": "2"
 }
}
 * 
 * 
*/