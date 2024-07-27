const config = {
	globals: {
		__DEV__: true,
	},
	preset: 'ts-jest',
	testEnvironment: 'jsdom',
	setupFilesAfterEnv: [
		'<rootDir>/jest.setup.js',
		//'<rootDir>/enzyme.setup.js',
		`<rootDir>/jest-shim.js`,
	],
	transformIgnorePatterns: ['node_modules/(?!variables/.*)'],
	transform: {
		'^.+\\.(ts|tsx)$': 'ts-jest',
		'^.+\\.jsx?$': 'babel-jest',
	},
	moduleNameMapper: {
		'\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
			'<rootDir>/__mocks__/fileMock.js',
		'\\.(css|less)$': '<rootDir>/__mocks__/styleMock.js',
	},
};

module.exports = config;
