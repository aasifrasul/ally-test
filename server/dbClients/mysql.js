const mysql = require('mysql2');

const { logger } = require('../Logger');

let pool;

function createPool() {
	pool = mysql.createPool({
		host: 'localhost',
		port: 3306,
		user: 'test',
		password: 'test',
		database: 'test',
		waitForConnections: true,
		connectionLimit: 10,
		maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
		idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
		queueLimit: 0,
		enableKeepAlive: true,
		keepAliveInitialDelay: 0,
		allowPublicKeyRetrieval: true,
		ssl: false,
	});
}

createPool();

pool.on('acquire', ({ threadId }) => logger.info(`Connection ${threadId} acquired`));

pool.on('connection', ({ threadId }) => logger.info(`Connection ${threadId} established`));

pool.on('enqueue', () => logger.info('Waiting for available connection slot'));

pool.on('release', ({ threadId }) => logger.info(`Connection ${threadId} released`));

const executeQuery = (query) =>
	new Promise((resolve, reject) => {
		if (pool._closed) {
			logger.info(`Pool is closed creating again`);
			createPool();
		}
		pool.getConnection((err, connection) => {
			if (err) {
				logger.warn(`Database connection Error: ${err.stack}`);
				throw err;
			}

			// Use the connection
			connection.query(query, (error, results, fields) => {
				// When done with the connection, release it.
				logger.info(`results -> ${JSON.stringify(results)}`);
				logger.info(`fields -> ${JSON.stringify(fields)}`);

				if (error) {
					logger.info(`failed to execute query -> ${JSON.stringify(error)}`);
					reject(error);
				} else {
					let cleanedData = results.map((row) => ({ ...row }));
					logger.info(`rows -> ${JSON.stringify(cleanedData)}`);
					resolve(cleanedData);
				}
				pool.releaseConnection(conn);
			});
		});
	});

const closePool = () =>
	pool.end((err) => logger.info(`all connections in the pool have ended ${err}`));

module.exports = { executeQuery, closePool };
