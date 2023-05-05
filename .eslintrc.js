module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	extends: [
		'plugin:react/recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:react-hooks/recommended',
	],
	overrides: [
		{
			files: ['**/*.js', '**/*.jsx'],
			plugins: ['@typescript-eslint'],
			extends: [
				'eslint:recommended',
				'plugin:@typescript-eslint/recommended',
				'eslint:recommended',
				'plugin:react/recommended',
			],
			parser: '@typescript-eslint/parser',
			parserOptions: {
				project: ['./tsconfig.json'],
			},
		},
	],

	plugins: ['core-dev-linting', 'jsdoc', 'react-hooks'],
	parserOptions: {
		ecmaVersion: 2015, // Allows for the parsing of modern ECMAScript features
		ecmaFeatures: {
			jsx: true,
		},
		sourceType: 'module', // Allows for the use of imports
	},
	rules: {
		'@typescript-eslint/no-var-requires': 'off',
		'@typescript-eslint/no-inferrable-types': 'off',
		'@typescript-eslint/no-unused-vars': 'error',
		'core-dev-linting/no-form-tag': 'error',
		'react-hooks/rules-of-hooks': 'warn', // let's test rules-of-hooks
		'react-hooks/exhaustive-deps': 'warn', // let's exhaustive-deps
		// Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
		// e.g. "@typescript-eslint/explicit-function-return-type": "off",
	},
	globals: {
		Action: false,
		__DEV__: false,
		__PROD__: false,
		__DEBUG__: false,
		__DEBUG_NEW_WINDOW__: false,
		__BASENAME__: false,
		__APPVERSION__: false,
		__THEME__: false,
		__IS_AUDI__: false,
		__IS_DEFAULT__: false,
		expect: false,
		should: false,
		sinon: false,
		shallow: false,
		mount: false,
		google: true,
		__dirname: true,
		path: true,
		cy: true,
	},
	settings: {
		react: {
			version: 'detect',
		},
	},
};
