import cluster from 'cluster';
import os from 'os';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pathRootDir = path.join(__dirname, '..');

const cpuCount = os.cpus().length;

console.log(`The total number of CPUs is ${cpuCount}`);
console.log(`Primary pid=${process.pid}`);

const serverFile = path.join(pathRootDir, 'server.ts');
console.log(`serverFile=${serverFile}`);
cluster.setupPrimary({
	exec: serverFile,
});

for (let i = 0; i < cpuCount; i++) {
	cluster.fork();
}
cluster.on('exit', (worker) => {
	console.log(`worker ${worker.process.pid} has been killed`);
	console.log('Starting another worker');
	cluster.fork();
});
