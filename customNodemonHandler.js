const chokidar = require('chokidar');
const path = require('path');
const { execSync } = require('child_process');

const debounceTime = 300;
let clientTimerId = null;
let serverTimerId = null;

const rootDir = path.resolve(__dirname);

function handleClientChange() {
	console.log('Change detected in client repository');
	try {
		console.log('Running client-specific command...');
		execSync('yarn build:client', { stdio: 'inherit' });
	} catch (error) {
		console.error('Error executing command for client:', error);
	}
}

function handleServerChange() {
	console.log('Change detected in server repository');
	try {
		console.log('Compiling server...');
		execSync('yarn build:server', { stdio: 'inherit' });
		console.log('Server compiled successfully');
	} catch (error) {
		console.error('Error compiling server:', error);
	}
}

const clientWatcher = chokidar.watch(path.join(rootDir, 'src', '**', '*.{js,jsx,ts,tsx}'), {
	ignored: /(^|[\/\\])\../, // ignore dotfiles
	persistent: true,
});

const serverWatcher = chokidar.watch(path.join(rootDir, 'server', 'src', '**', '*.ts'), {
	ignored: /(^|[\/\\])\../, // ignore dotfiles
	persistent: true,
});

clientWatcher.on('change', (path) => {
	console.log(`File ${path} has been changed`);
	clearTimeout(clientTimerId);
	clientTimerId = setTimeout(handleClientChange, debounceTime);
});

/*
serverWatcher.on('change', (path) => {
	console.log(`File ${path} has been changed`);
	clearTimeout(serverTimerId);
	serverTimerId = setTimeout(handleServerChange, debounceTime);
});
*/

console.log('Watching for changes...');

// Initial server compilation
execSync('yarn dev:server', { stdio: 'inherit' });

// Log watched directories
console.log('Watching client directory:', path.join(rootDir, 'src'));
console.log('Watching server directory:', path.join(rootDir, 'server', 'src'));
