// webpack
require('dotenv').config();
import { Server } from 'socket.io';
import http from 'http';
import app from './app.js';

import { onConnection } from './socketConnection.js';

const log = (msg) => console.log.bind(console, msg);
const error = (msg) => console.error.bind(console, msg);

/*
const db = mongoose.connection;
db.on('error', error('connection error:'));
db.once('open', () => log('connection successfull'));
*/

//Start the server

const server = http.createServer(app);

server.on('connection', (socket) => socket.on('close', () => log('server.connection')));
server.on('request', () => log('server.request'));
server.listen(process.env.PORT, 'localhost', () =>
	log(`webpack-dev-server listening on port ${process.env.PORT}`)
);

const io = new Server(server);

io.on('connection', onConnection);
