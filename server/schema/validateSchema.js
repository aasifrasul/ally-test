const { validateSchema } = require('graphql');

const { logger } = require('../Logger');

function validateGraphqlSchema(schema) {
	const errors = validateSchema(schema);

	if (errors.length > 0) {
		logger.error('Schema validation errors:', errors);
	}
}

module.exports = {
	validateGraphqlSchema,
};
