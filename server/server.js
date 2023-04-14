// webpack
const socketio = require('socket.io');
const http = require('http');
const webpack = require('webpack');
const fs = require('fs');
const mongoose = require('mongoose');
const WebpackDevServer = require('webpack-dev-server');
const cors = require('cors');
const express = require('express');
const exphbs = require('express-handlebars');
const handlebars = require('handlebars');
const cookieParser = require('cookie-parser');
const proxy = require('express-http-proxy');
const path = require('path');

const webpackConfig = require('../webpack-configs/webpack.config');
const AppHelper = require('./helper');
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

const enc = {
	encoding: 'utf-8',
};

const log = (msg) => console.log.bind(console, msg);
const error = (msg) => console.error.bind(console, msg);

/*
const db = mongoose.connection;
db.on('error', error('connection error:'));
db.once('open', () => log('connection successfull'));
*/

const generateBuildTime = async function () {
	fs.writeFile(
		path.join(__dirname, '..', 'public', 'server', 'buildtime'),
		new Date().toUTCString(),
		function (err) {
			err &&
				error('Error occured while writing to generateBuildTime :: ' + err.toString());
		},
	);
};

generateBuildTime();

const getStartTime = () => {
	if (process.env.NODE_ENV !== 'production') {
		return fs.readFileSync(
			path.join(__dirname, '..', 'public', 'server', 'buildtime'),
			enc,
		);
	}

	let startTime = fs.readFileSync(
		path.join(__dirname, 'public', 'server', 'buildtime'),
		enc,
	);
	startTime = new Date(Date.parse(startTime) + 1000000000).toUTCString();
	return startTime;
};

const startTime = getStartTime();

// Last modified header
// Assumtion here is that the everytime any file is modified, the build is restarted hence last-modified == build time.
const nocache = function (res) {
	res.set({
		'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
		Expires: 'Thu, 01 Jan 1970 00:00:00 GMT',
		Pragma: 'no-cache',
		'Last-Modified': startTime,
	});
};

const app = express();
// port to use
const port = 3100;

app.get('/WebWorker.js', fetchWebWorker);
app.get('/apiWorker.js', fetchApiWorker);
app.get('/api/fetchWineData/:pageNum', getCSVData);
app.get('/images/*', fetchImage);

//Set hbs template config
app.engine('.hbs', exphbs({ extname: '.hbs' }));
app.set('views', path.join(__dirname, '..', 'public', 'ally-test'));
app.set('view engine', '.hbs');

handlebars.registerHelper({
	if_eq: (a, b, opts) => {
		if (a === b) {
			return opts.fn(Object.create(null));
		}
	},
});

app.use([cors(), cookieParser(), userAgentHandler]);

const { publicPath } = webpackConfig.output || {};

// start the webpack dev server
const devServer = new WebpackDevServer(webpack(webpackConfig), {
	publicPath,
});

devServer.listen(port + 1, 'localhost', () =>
	log(`webpack-dev-server listening on port ${port + 1}`),
);

const server = http.createServer(app);

server.on('connection', (socket) => socket.on('close', () => log('server.connection')));

server.on('request', () => log('server.request'));

// const bundleConfig = [publicPath + 'en.bundle.js', publicPath + 'vendor.bundle.js', publicPath + 'app.bundle.js'];
const bundleConfig = ['en', 'vendor', 'app'].map((i) => `${publicPath}${i}.bundle.js`);

// start the express server
app.use(
	'/public',
	proxy(`localhost:${port + 1}`, {
		proxyReqPathResolver: (req) => req.originalUrl,
	}),
);
//app.use(express.static(path.join(__dirname, '..', 'public')));

app.all('/*', (req, res) => {
	const data = {
		js: bundleConfig,
		...AppHelper.constructReqDataObject(req),
		dev: true,
		layout: false,
	};
	res.render('next1-ally-test', data);
});

//Start the server
server.listen(port, 'localhost', () => log(`webpack-dev-server listening on port ${port}`));

const io = socketio(server);

io.on('connection', onConnection);
