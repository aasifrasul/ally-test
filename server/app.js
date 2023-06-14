const cors = require('cors');
const express = require('express');
const exphbs = require('express-handlebars');
const cookieParser = require('cookie-parser');
const serveStatic = require('serve-static');
const mongoose = require('mongoose');

const {
	userAgentHandler,
	getCSVData,
	fetchImage,
	fetchWebWorker,
	fetchApiWorker,
	compiledTemplate,
	handleGraphql,
} = require('./middlewares');
const webpackConfig = require('../webpack-configs/webpack.config');
const { constructReqDataObject, generateBuildTime } = require('./helper');
const { logger } = require('./Logger');
const { pathTemplate, pathRootDir } = require('./paths');

// mongoose.connect('mongodb://localhost:27017/test', { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();

generateBuildTime();

// middlewares
app.get('/WebWorker.js', fetchWebWorker);
app.get('/apiWorker.js', fetchApiWorker);
app.get('/api/fetchWineData/*', getCSVData);
app.get('/images/*', fetchImage);
app.use('/graphql/*', handleGraphql);

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

module.exports = {
	app,
};
