import js from '@eslint/js';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsdocPlugin from 'eslint-plugin-jsdoc';

export default [
	// Base recommended config
	js.configs.recommended,

	// Ignore the config file itself
	{
		ignores: [
			'eslint.config.js',
			'dist/**',
			'node_modules/**',
			'public/**',
			'webpack/**',
			'webpack-configs/**',
			'*.config.{js,ts,mjs,cjs}',
			'**/*/d.ts'
		],
	},

	// Global configuration for all files (without TypeScript project)
	{
		files: ['./src/**/*.{js,jsx,ts,tsx}'],
		plugins: {
			'@typescript-eslint': typescriptPlugin,
			react: reactPlugin,
			'react-hooks': reactHooksPlugin,
			jsdoc: jsdocPlugin,
		},
		languageOptions: {
			parser: typescriptParser,
			ecmaVersion: 2015,
			sourceType: 'module',
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
			globals: {
				Action: 'readonly',
				__DEV__: 'readonly',
				__PROD__: 'readonly',
				__DEBUG__: 'readonly',
				__DEBUG_NEW_WINDOW__: 'readonly',
				__BASENAME__: 'readonly',
				__APPVERSION__: 'readonly',
				__THEME__: 'readonly',
				__IS_AUDI__: 'readonly',
				__IS_DEFAULT__: 'readonly',
				expect: 'readonly',
				should: 'readonly',
				sinon: 'readonly',
				shallow: 'readonly',
				mount: 'readonly',
				google: 'writable',
				__dirname: 'writable',
				path: 'writable',
				cy: 'writable',
				// Browser environment
				window: 'readonly',
				document: 'readonly',
				navigator: 'readonly',
			},
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
		rules: {
			// TypeScript rules (basic, without type-aware linting)
			'@typescript-eslint/no-var-requires': 'off',
			'@typescript-eslint/no-inferrable-types': 'off',
			'@typescript-eslint/no-unused-vars': 'error',

			// React hooks rules
			'react-hooks/rules-of-hooks': 'warn',
			'react-hooks/exhaustive-deps': 'warn',

			// General rules
			'no-underscore-dangle': 'off',
		},
	},

	// TypeScript specific configuration WITH type-aware linting (only for server files)
	{
		files: ['./server/src/**/*.{ts,tsx}'],
		languageOptions: {
			parser: typescriptParser,
			parserOptions: {
				project: './server/tsconfig.json',
				tsconfigRootDir: './server',
			},
		},
		rules: {
			...typescriptPlugin.configs.recommended.rules,
			'@typescript-eslint/no-var-requires': 'off',
			'@typescript-eslint/no-inferrable-types': 'off',
			'@typescript-eslint/no-unused-vars': 'error',
		},
	},

	// React configuration
	{
		files: ['**/*.{js,jsx,ts,tsx}'],
		rules: {
			...reactPlugin.configs.recommended.rules,
		},
	},
];
