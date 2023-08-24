import cors from 'cors';
import express from 'express';
import exphbs from 'express-handlebars';
import cookieParser from 'cookie-parser';
import serveStatic from 'serve-static';
import mongoose from 'mongoose';

import {
    userAgentHandler,
    getCSVData,
    fetchImage,
    fetchWebWorker,
    fetchApiWorker,
    compiledTemplate,
    handleGraphql,
} from './middlewares.js';

import webpackConfig from '../webpack-configs/webpack.config.js';
import { constructReqDataObject, generateBuildTime } from './helper.js';
import { logger } from './Logger.js';
import { pathTemplate, pathRootDir } from './paths.js';

// mongoose.connect('mongodb://localhost:27017/test', { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();

generateBuildTime();

// middlewares
app.get('/WebWorker.js', fetchWebWorker);
app.get('/apiWorker.js', fetchApiWorker);
app.get('/api/fetchWineData/*', getCSVData);
app.get('/images/*', fetchImage);
app.use('/graphql/*', handleGraphql);

app.use('/login', (req, res) => {
	res.send({
		token: 'test123',
	});
});

//Set hbs template config
app.engine('.hbs', exphbs({ extname: '.hbs' }));
app.set('views', pathTemplate);
app.set('view engine', '.hbs');

app.use([cors(), cookieParser(), userAgentHandler]);
const publicPath = webpackConfig?.output?.publicPath;

// const bundleConfig = [publicPath + 'en.bundle.js', publicPath + 'vendor.bundle.js', publicPath + 'app.bundle.js'];
const bundleConfig = ['en', 'vendor', 'app'].map((i) => `${publicPath}${i}.bundle.js`);

app.use(
	serveStatic(pathRootDir, {
		index: ['default.html', 'default.htm', 'index.hbs'],
	})
);

app.all('*', (req, res) => {
	const data = {
		js: bundleConfig,
		...constructReqDataObject(req),
		dev: true,
		layout: false,
	};
	res.send(compiledTemplate(data));
});

export default app;
