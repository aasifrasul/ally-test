#!/usr/bin/env node

import http from 'http';
import fs from 'fs-extra';
import path from 'path';
import bodyParser from 'body-parser';
import express, { Application, Request, Response, NextFunction } from 'express';

import { logger } from './src/Logger';
import { pathRootDir } from './src/paths';

const port = 3000;
const host = '127.0.0.1';

const app: Application = express();

const httpServer: http.Server = http.createServer(app);

httpServer.listen(port, host, () => {
	console.log('Server Started');
});

// Middleware for JSON
app.use(express.json());

// Middleware for URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Middleware for plain text
app.use(bodyParser.text());

app.get('/health', (req: Request, res: Response, next: NextFunction) => {
	res.status(200).send({ result: 'Running', timeStamp: Date.now() });
});

app.get('/getFileContents', (req: Request, res: Response, next: NextFunction) => {
	const data = fs.readFileSync(path.join(pathRootDir, 'combined.log'), 'utf8');

	res.setHeader('Content-Type', 'text/plain; charset=utf-8');
	res.status(200).send({ result: 'Running', data });
});

app.get('/userDetails/:id', (req: Request, res: Response, next: NextFunction) => {
	const params = req.params;
	res.setHeader('Content-Type', 'text/plain; charset=utf-8');
	res.status(200).send({ result: 'Running', params });
});

app.get('/userDetails', (req: Request, res: Response, next: NextFunction) => {
	const query = req.query;
	res.status(200).send({ result: 'Running', query });
});

app.post('/userDetails', (req: Request, res: Response, next: NextFunction) => {
	const body = req.body;
	logger.info(JSON.stringify(body));
	res.setHeader('Content-Type', 'text/plain; charset=utf-8');
	res.status(200).send({ result: 'Running', data: JSON.stringify(body) });
});

app.all('*', (req: Request, res: Response, next: NextFunction) => {
	res.status(404);
	const message = 'Oops! Page not found.';

	if (req.accepts('html')) {
		res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Error</title>
            </head>
            <body>
                <h1>${message}</h1>
            </body>
            </html>
        `);
	} else {
		res.json({ message });
	}
});
