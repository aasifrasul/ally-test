// webpack
require('dotenv').config();
const socketio = require('socket.io');
const http = require('http');

const { app } = require('./app');
const { onConnection } = require('./socketConnection');

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

const io = socketio(server);

io.on('connection', onConnection);
