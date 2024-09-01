const cors = require('cors');
const express = require('express');
const exphbs = require('express-handlebars');
const cookieParser = require('cookie-parser');
const serveStatic = require('serve-static');
const { createProxyMiddleware } = require('http-proxy-middleware');

const {
	userAgentHandler,
	getCSVData,
	fetchImage,
	fetchWebWorker,
	fetchApiWorker,
	compiledTemplate,
	handleGraphql,
} = require('./middlewares');
const { constructReqDataObject, generateBuildTime } = require('./helper');
const { appBuildDev, pathTemplate, pathRootDir } = require('./paths');

const app = express();

generateBuildTime();

// middlewares
app.get('/WebWorker.js', fetchWebWorker);
app.get('/apiWorker.js', fetchApiWorker);
app.get('/api/fetchWineData/*', getCSVData);
app.get('/images/*', fetchImage);
//app.use('/graphql/*', handleGraphql);
app.all('/graphql', handleGraphql);

app.use(
	'/proxy/okrcentral',
	createProxyMiddleware({
		target: 'https://okrcentral.github.io',
		changeOrigin: true,
		pathRewrite: {
			'^/proxy/okrcentral': '/sample-okrs/db.json', // rewrite path
		},
	}),
);
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

const bundleConfig = ['en', 'vendor', 'app'].map((i) => `${appBuildDev}${i}.bundle.js`);

app.use(
	serveStatic(pathRootDir, {
		index: ['default.html', 'default.htm', 'index.hbs'],
	}),
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
