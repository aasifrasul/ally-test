const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const reactPlugin = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');

module.exports = [
	{
		ignores: ['dist', 'build', 'node_modules', 'public', 'eslint.config.js'],
	},

	js.configs.recommended,

	reactPlugin.configs.flat.recommended,

	{
		files: ['**/*.{ts,tsx}'],

		languageOptions: {
			parser: tsParser,
			ecmaVersion: 'latest',
			sourceType: 'module',
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
		},

		plugins: {
			'@typescript-eslint': tsPlugin,
			react: reactPlugin,
			'react-hooks': reactHooks,
		},

		settings: {
			react: {
				version: 'detect',
			},
		},

		rules: {
			...tsPlugin.configs.recommended.rules,
			...reactHooks.configs.recommended.rules,

			'@typescript-eslint/no-unused-vars': 'error',
			'@typescript-eslint/no-inferrable-types': 'off',
			'@typescript-eslint/no-var-requires': 'off',

			'react/display-name': 'off',
			'react/react-in-jsx-scope': 'off',

			'no-underscore-dangle': 'off',
		},
	},

	{
		files: ['server/**/*.{ts,tsx}'],
		languageOptions: {
			parserOptions: {
				project: './server/tsconfig.json',
			},
		},
	},
];
