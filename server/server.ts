#!/usr/bin/env node

import http from 'http';
import fs from 'fs-extra';
import path from 'path';
import bodyParser from 'body-parser';
import csv from 'csv-parser';
import express, { Application, Request, Response, NextFunction } from 'express';

import { logger } from './src/Logger';
import { pathRootDir, pathAssets } from './src/paths';
import { executeQuery } from './src/dbClients/helper';

const port = 3000;
const host = '127.0.0.1';

const app: Application = express();

const httpServer: http.Server = http.createServer(app);

httpServer.listen(port, host, () => logger.log('', 'Server Started'));

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

app.get('/db-setup', async (req, res) => {
	try {
		await executeQuery('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
		await executeQuery(`CREATE TABLE IF NOT EXISTS "TEST_USERS" (
			id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
			first_name VARCHAR(4000), -- VARCHAR is the correct type, and length is specified in parentheses
			last_name VARCHAR(4000),  -- VARCHAR is the correct type, and length is specified in parentheses
			age INTEGER               -- INTEGER is the correct type
		);`);
		await executeQuery(`CREATE TABLE IF NOT EXISTS "TEST_PRODUCTS" (
			id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
			name VARCHAR(4000), -- VARCHAR is the correct type, and length is specified in parentheses
			category VARCHAR(4000)  -- VARCHAR is the correct type, and length is specified in parentheses
		);`);
		await executeQuery(`CREATE TABLE IF NOT EXISTS "book_store" (
			id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
			title VARCHAR(4000),	-- VARCHAR is the correct type, and length is specified in parentheses
			author VARCHAR(4000),	-- VARCHAR is the correct type, and length is specified in parentheses
			status VARCHAR(4000)	-- INTEGER is the correct type
		);`);
		res.send('Postgres Db setup successfully!');
	} catch (err) {
		logger.warn(`Datanse Error => ${err}`);
		res.status(500).send(`Datanse Error => ${err}`);
	}
});

app.get('/process-csv', (req, res) => {
	res.setHeader('Content-Type', 'application/json');
	res.setHeader('Transfer-Encoding', 'chunked');

	let isFirstChunk = true;
	const filePath = path.join(pathAssets, 'winemag-data-130k-v2.csv');
	const processRow = (row: string) => row;
	res.write('['); // Start JSON array

	fs.createReadStream(filePath, 'utf8')
		.pipe(csv())
		.on('data', (row) => {
			// Process each row
			const processedRow = processRow(row); // Your processing logic

			if (!isFirstChunk) {
				res.write(',');
			}
			res.write(JSON.stringify(processedRow));
			isFirstChunk = false;
		})
		.on('end', () => {
			res.write(']'); // End JSON array
			res.end();
			console.log('CSV processing complete.');
		})
		.on('error', (err) => {
			console.error('Error processing CSV:', err);
			res.status(500).end('Error processing CSV file.');
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
