#!/usr/bin/env node

import http from 'http';
import fs from 'fs-extra';
import path from 'path';
import bodyParser from 'body-parser';
import csv from 'csv-parser';
import express, { Application, Request, Response, NextFunction } from 'express';

import { logger } from './src/Logger';
import { pathRootDir } from './src/paths';

const port = 3000;
const host = '127.0.0.1';

const app: Application = express();

const httpServer: http.Server = http.createServer(app);

httpServer.listen(port, host, () => logger.log('Server Started'));

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

app.post('/upload', (req, res) => {
	const filename = 'uploaded_file.dat'; // Or generate a unique name
	const writeStream = fs.createWriteStream(path.join(__dirname, 'uploads', filename));

	req.pipe(writeStream);

	req.on('end', () => {
		res.send('File uploaded successfully!');
		logger.log('File saved to:', path.join(__dirname, 'uploads', filename));
	});

	req.on('error', (err) => {
		logger.error('Error during upload:', err);
		res.status(500).send('Error during file upload.');
		// Clean up the partially written file if necessary
		fs.unlink(path.join(__dirname, 'uploads', filename), (unlinkErr) => {
			if (unlinkErr) logger.error('Error deleting incomplete file:', unlinkErr);
		});
	});

	writeStream.on('error', (err) => {
		logger.error('Error writing to file:', err);
		res.status(500).send('Error saving file.');
	});
});

app.post('/process-csv', (req, res) => {
	req.pipe(csv())
		.on('data', (row: any) => {
			// Process each row of the CSV data here
			console.log('Processing row:', row);
			// You could save this data to a database, perform calculations, etc.
		})
		.on('end', () => {
			res.send('CSV file processed successfully!');
			console.log('CSV processing complete.');
		})
		.on('error', (err: any) => {
			console.error('Error processing CSV:', err);
			res.status(500).send('Error processing CSV file.');
		});
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
