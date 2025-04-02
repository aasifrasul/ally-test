import cluster from 'cluster';
import http from 'http';
import os from 'os';

const numCPUs: number = os.cpus().length;

if (cluster.isPrimary) {
	console.log(`Master ${process.pid} is running`);

	// Fork workers based on CPU count
	for (let i = 0; i < numCPUs; i++) {
		cluster.fork();
	}

	cluster.on('exit', (worker, code, signal) => {
		console.log(`Worker ${worker.process.pid} died`);
		// You can fork a new worker when one dies
		cluster.fork();
	});
} else {
	// Workers share the same port
	http.createServer((req, res) => {
		res.writeHead(200);
		res.end(`Worker ${process.pid} handled the request\n`);
	}).listen(8000);

	console.log(`Worker ${process.pid} started`);
}
