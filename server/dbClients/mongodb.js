const mongoose = require('mongoose');

const { constants } = require('../constants');

const { logger } = require('../Logger');

const connectToMongoDB = async () => {
	try {
		await mongoose.connect(constants.dbLayer.mongodb.uri, {
			maxPoolSize: 10,
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 45000,
		});

		logger.info('Connected to MongoDB successfully');
	} catch (error) {
		logger.error('Failed to connect to MongoDB:', error);
		process.exit(1);
	}
};

const disconnectFromMongoDB = async () => {
	try {
		logger.info('Closing MongoDB connection...');
		await mongoose.connection.close();
		logger.info('Disconnected from MongoDB successfully');
	} catch (error) {
		logger.error('Failed to disconnect from MongoDB:', error);
	}
};

module.exports = { connectToMongoDB, disconnectFromMongoDB };
