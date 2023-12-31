#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const socketio = require('socket.io');
const http = require('http');

const { app } = require('./app');
const { onConnection } = require('./socketConnection');

const log = (msg) => console.log.bind(console, msg);
const error = (msg) => console.error.bind(console, msg);

const { NODE_PORT: port, NODE_HOST: host } = process.env;

/*
const db = mongoose.connection;
db.on('error', error('connection error:'));
db.once('open', () => log('connection successfull'));
*/

//Start the server

const server = http.createServer(app);

server.on('connection', (socket) => socket.on('close', () => log('server.connection')));
server.on('request', () => log('server.request'));
server.listen(port, host, () => log(`webpack-dev-server listening on port ${port}`));

const io = socketio(server);

io.on('connection', onConnection);

let isExitCalled = false;

// eslint-disable-next-line no-console
process.on('unhandledRejection', (e) => console.log(e));
// eslint-disable-next-line no-console
process.on('uncaughtException', (e) => console.log(e));

process.once('exit', () => {
	if (isExitCalled) {
		return;
	}

	isExitCalled = true;

	process.exit(0);
});
