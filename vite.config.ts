import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src'),
			components: path.resolve(__dirname, 'src/components'),
			actions: path.resolve(__dirname, 'src/actions'),
			stores: path.resolve(__dirname, 'src/stores'),
			helpers: path.resolve(__dirname, 'src/helpers'),
			utils: path.resolve(__dirname, 'src/utils'),
			images: path.resolve(__dirname, 'src/images'),
			mocks: path.resolve(__dirname, 'src/mocks'),
		},
		extensions: ['.ts', '.tsx', '.js', '.jsx', '.css'],
	},
	server: {
		port: 3000,
		open: true,
		hmr: true, // HMR is enabled by default
	},
	build: {
		outDir: process.env.NODE_ENV === 'production' ? 'build' : 'build-dev',
		sourcemap: process.env.NODE_ENV !== 'production',
	},
	css: {
		modules: {
			localsConvention: 'camelCaseOnly',
		},
	},
});
