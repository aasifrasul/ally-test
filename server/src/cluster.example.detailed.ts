import cluster from 'cluster';
import http from 'http';
import os from 'os';
const numCPUs: number = os.cpus().length;

interface WorkerInfo {
	pid: number;
	requests: number;
}

if (cluster.isPrimary) {
	console.log(`Master ${process.pid} is running`);
	// Keep track of request counts per worker
	const workers: { [id: number]: WorkerInfo } = {};
	// Fork workers
	for (let i = 0; i < numCPUs; i++) {
		const worker = cluster.fork();
		if (worker && worker.id) {
			workers[worker.id] = { pid: worker.process.pid as number, requests: 0 };
			// Receive messages from workers
			worker.on('message', (msg: { cmd?: string }) => {
				if (msg && msg.cmd && msg.cmd === 'incrementRequestCount') {
					if (workers[worker.id]) { // Check if worker exists before incrementing
						workers[worker.id].requests++;
						console.log(
							`Worker ${worker.process.pid} has handled ${workers[worker.id].requests} requests`,
						);
					}
				}
			});
		}
	}
	// Handle worker exit
	cluster.on('exit', (worker, code, signal) => {
		if (worker && worker.id && workers[worker.id]) {
			console.log(
				`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`,
			);
			console.log(
				`Worker handled ${workers[worker.id].requests} requests in its lifetime`,
			);
			delete workers[worker.id];
		}
		// Start a new worker
		const newWorker = cluster.fork();
		if (newWorker && newWorker.id) {
			workers[newWorker.id] = { pid: newWorker.process.pid as number, requests: 0 };
		}
	});
	// Graceful shutdown
	process.on('SIGTERM', () => {
		console.log('Master shutting down...');
		for (const id in cluster.workers) {
			if (cluster.workers[id]) {
				cluster.workers[id]?.send('shutdown');
			}
		}
	});
} else {
	// Worker process
	const server = http.createServer((req, res) => {
		// Inform master about this request
		if (process.send) {
			process.send({ cmd: 'incrementRequestCount' });
		}
		// Simulate some work
		let result = 0;
		for (let i = 0; i < 1000000; i++) {
			result += i;
		}
		res.writeHead(200);
		res.end(`Hello from worker ${process.pid}, sum: ${result}\n`);
	});
	server.listen(8000);
	console.log(`Worker ${process.pid} started`);
	// Graceful shutdown for workers
	process.on('message', (msg: string) => {
		if (msg === 'shutdown') {
			console.log(`Worker ${process.pid} shutting down...`);
			server.close(() => {
				process.exit(0);
			});
		}
	});
}