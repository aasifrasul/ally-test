// webpack
import { Server } from 'socket.io';
import http from 'http';
import webpack from 'webpack';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import cors from 'cors';
import express from 'express';
import handlebars from 'handlebars';
import WebpackDevServer from 'webpack-dev-server';
import exphbs from 'express-handlebars';
import cookieParser from 'cookie-parser';
import proxy from 'express-http-proxy';

import { constructReqDataObject } from './helper.js';
import { userAgentHandler, getCSVData } from './middlewares.js';
import { onConnection } from './socketConnection.js';
import { webpackConfig } from '../webpack-configs/webpack.config.js';

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
	fs.writeFile(path.resolve('', '..', 'public', 'server', 'buildtime'), new Date().toUTCString(), function (err) {
		err && error('Error occured while writing to generateBuildTime :: ' + err.toString());
	});
};

generateBuildTime();

const getStartTime = () => {
	if (process.env.NODE_ENV !== 'production') {
		return fs.readFileSync(path.resolve('public', 'server', 'buildtime'), enc);
	}

	let startTime = fs.readFileSync(path.resolve('', 'public', 'server', 'buildtime'), enc);
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

const webWorkerContent = fs.readFileSync(`./src/utils/WebWorker.js`, enc);
const apiWorkerContent = fs.readFileSync(`./src/workers/apiWorker.js`, enc);

const app = express();
// port to use
const port = 3100;

app.get('/WebWorker.js', function (req, res) {
	res.set('Content-Type', `application/javascript; charset=${enc.encoding}`);
	nocache(res);
	res.end(webWorkerContent);
});

app.get('/apiWorker.js', function (req, res) {
	res.set('Content-Type', `application/javascript; charset=${enc.encoding}`);
	nocache(res);
	res.end(apiWorkerContent);
});

app.get('/api/fetchWineData/:pageNum', getCSVData);

//Set hbs template config
app.engine('.hbs', exphbs({ extname: '.hbs' }));
app.set('views', path.resolve('', '..', 'public', 'ally-test'));
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

devServer.listen(port + 1, 'localhost', () => log('webpack-dev-server listening on port 3001'));

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
server.listen(port, 'localhost', () => log('webpack-dev-server listening on port 3001'));

const io = new Server(server);

io.on('connection', onConnection);
