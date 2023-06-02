const path = require('path');

const paths = {
	pathRoot: path.join(__dirname),
	pathRootDir: path.join(__dirname, '..'),
	pathSource: path.join(__dirname, '..', 'src'),
	pathBuild: path.join(__dirname, '..', 'build'),
	pathPublic: path.join(__dirname, '..', 'public'),
	pathTemplate: path.join(__dirname, '..', 'public', 'ally-test'),
	pathImage: path.join(__dirname, '..', 'assets', 'images'),
	pathBuildTime: path.join(__dirname, '..', 'public', 'server', 'buildtime'),
	pathTSConfig: path.join(__dirname, '..', 'tsconfig.json'),
	pathRecordsJSON: path.join(__dirname, '..', 'records.json'),
};

module.exports = {
	...paths,
};
