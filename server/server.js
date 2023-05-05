// webpack
const socketio = require('socket.io');
const http = require('http');
const serveStatic = require('serve-static');
const mongoose = require('mongoose');
const cors = require('cors');
const express = require('express');
const exphbs = require('express-handlebars');
const handlebars = require('handlebars');
const cookieParser = require('cookie-parser');
const path = require('path');

const webpackConfig = require('../webpack-configs/webpack.config');
const { constructReqDataObject, generateBuildTime, getStartTime } = require('./helper');
const {
	userAgentHandler,
	getCSVData,
	fetchImage,
	fetchWebWorker,
	fetchApiWorker,
} = require('./middlewares');
const { onConnection } = require('./socketConnection');
const { logger } = require('./Logger');

// mongoose.connect('mongodb://localhost:27017/test', { useNewUrlParser: true, useUnifiedTopology: true });

const log = (msg) => console.log.bind(console, msg);
const error = (msg) => console.error.bind(console, msg);

/*
const db = mongoose.connection;
db.on('error', error('connection error:'));
db.once('open', () => log('connection successfull'));
*/

generateBuildTime();

const app = express();
// port to use
const port = 3100;

// middlewares
app.get('/WebWorker.js', fetchWebWorker);
app.get('/apiWorker.js', fetchApiWorker);
app.get('/api/fetchWineData/*', getCSVData);
app.get('/images/*', fetchImage);

//Set hbs template config
app.engine('.hbs', exphbs({ extname: '.hbs' }));
app.set('views', path.join(__dirname, '..', 'public', 'ally-test'));
app.set('view engine', '.hbs');

handlebars.registerHelper({
	if_eq: (a, b, opts) => a === b && opts.fn(Object.create(null)),
});

app.use([cors(), cookieParser(), userAgentHandler]);
const { publicPath } = webpackConfig.output || {};

const server = http.createServer(app);

server.on('connection', (socket) => socket.on('close', () => log('server.connection')));

server.on('request', () => log('server.request'));

// const bundleConfig = [publicPath + 'en.bundle.js', publicPath + 'vendor.bundle.js', publicPath + 'app.bundle.js'];
const bundleConfig = ['en', 'vendor', 'app'].map((i) => `${publicPath}${i}.bundle.js`);

app.use(
	serveStatic(path.join(__dirname, '..'), {
		index: ['default.html', 'default.htm', 'next1-ally-test.hbs'],
	}),
);

app.all('/*', (req, res) => {
	const data = {
		js: bundleConfig,
		...constructReqDataObject(req),
		dev: true,
		layout: false,
	};
	res.render('next1-ally-test', data);
});

//Start the server
server.listen(port, 'localhost', () => log(`webpack-dev-server listening on port ${port}`));

const io = socketio(server);

io.on('connection', onConnection);
