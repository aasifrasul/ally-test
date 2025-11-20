#!/usr/bin/env node

import http from 'http';
import fs from 'fs-extra';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import axios from 'axios';
import path from 'path';
import bodyParser from 'body-parser';
import csv from 'csv-parser';
import express from 'express';
import type { Application, Request, Response, NextFunction } from 'express';

import { logger } from './src/Logger';
import { pathRootDir, pathAssets } from './src/paths';
import { executeQuery } from './src/dbClients/helper';
import { verifyToken } from './src/services/tokenService';
import { isProdEnv, JWT_SECRET } from './src/envConfigDetails';
import { finalHandler } from './src/globalErrorHandler';
import { errorHandler } from './src/middlewares/errorHandler';

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

async function authenticateUser(username: string, password: string) {
	// Replace with your actual authentication logic
	// This is just a placeholder
	const users = [
		{
			id: 1,
			username: 'john',
			password: 'hashed_password',
			name: 'John Doe',
			email: 'john@example.com',
			roles: ['user'],
		},
	];

	const user = users.find((u) => u.username === username);
	if (user && (await bcrypt.compare(password, user.password))) {
		return user;
	}
	return null;
}

async function createOrUpdateUser(userData: string) {
	// Database logic to create or update user
	// This is a placeholder
	return userData;
}

// Exchange authorization code for access token
app.post('/api/oauth/token', async (req: Request, res: Response) => {
	const { code } = req.body;

	try {
		const tokenResponse = await axios.post(
			'https://github.com/login/oauth/access_token',
			{
				client_id: process.env.GITHUB_CLIENT_ID,
				client_secret: process.env.GITHUB_CLIENT_SECRET,
				code: code,
				redirect_uri: 'http://localhost:3000/callback',
			},
			{
				headers: {
					Accept: 'application/json',
				},
			},
		);

		const { access_token, refresh_token, token_type } = tokenResponse.data;

		// Optionally fetch user info
		const userResponse = await axios.get('https://api.github.com/user', {
			headers: {
				Authorization: `${token_type} ${access_token}`,
				'User-Agent': 'MyApp/1.0',
			},
		});

		// Store user session (use proper session management in production)
		const { id, login, email, avatar_url } = userResponse.data;

		res.json({
			access_token,
			refresh_token,
			user: { id, login, email, avatar_url },
		});
	} catch (error: any) {
		console.error('OAuth error:', error.response?.data || error.message);
		res.status(400).json({ error: 'OAuth authorization failed' });
	}
});

// Protected API endpoint using OAuth token
app.get('/api/user/repos', async (req: Request, res: Response): Promise<any> => {
	const token = req.headers.authorization?.replace('Bearer ', '');

	if (!token) {
		return res.status(401).json({ error: 'No token provided' });
	}

	try {
		const response = await axios.get('https://api.github.com/user/repos', {
			headers: {
				Authorization: `Bearer ${token}`,
				'User-Agent': 'MyApp/1.0',
			},
		});

		res.json(response.data);
	} catch (error) {
		res.status(401).json({ error: 'Invalid or expired token' });
	}
});

// =============================================================================
// 3. JWT-based SSO Implementation
// =============================================================================

// SSO Login endpoint
app.post('/sso/login', async (req: Request, res: Response): Promise<any> => {
	const { username, password } = req.body;

	// Validate credentials (replace with your auth logic)
	const user = await authenticateUser(username, password);

	if (!user) {
		return res.status(401).json({ error: 'Invalid credentials' });
	}

	// Create JWT token with user info
	const payload = {
		sub: user.id,
		name: user.name,
		email: user.email,
		roles: user.roles,
		iat: Math.floor(Date.now() / 1000),
		exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
		iss: 'your-sso-provider.com',
		aud: 'your-applications',
	};

	const token = jwt.sign(payload, JWT_SECRET, {
		algorithm: 'HS256',
	});

	// Set secure httpOnly cookie
	res.cookie('sso_token', token, {
		httpOnly: true,
		secure: isProdEnv,
		sameSite: 'strict',
		maxAge: 3600000, // 1 hour
	});

	res.json({
		success: true,
		user: { id: user.id, name: user.name, email: user.email },
	});
});

/*
// SSO validation middleware for other applications
function validateSSOToken(req: Request, res: Response, next: NextFunction) {
	const token = req.cookies.sso_token || req.headers.authorization?.replace('Bearer ', '');

	if (!token) {
		return res.status(401).json({ error: 'No SSO token provided' });
	}

	try {
		const decoded = verifyToken(token, 'access');
		req.user = decoded;
		next();
	} catch (error) {
		return res.status(401).json({ error: 'Invalid SSO token' });
	}
}

// =============================================================================
// 4. SAML SSO Implementation (using passport-saml)
// =============================================================================

const passport = require('passport');
const SamlStrategy = require('passport-saml').Strategy;

// SAML SSO routes
app.get(
	'/login',
	passport.authenticate('saml', {
		failureRedirect: '/login/error',
	}),
);

app.post(
	'/login/callback',
	passport.authenticate('saml', {
		failureRedirect: '/login/error',
		successRedirect: '/dashboard',
	}),
);

// =============================================================================
// 5. OpenID Connect (OIDC) Implementation
// =============================================================================

const { Issuer, Strategy } = require('openid-client');

async function setupOIDC() {
	const googleIssuer = await Issuer.discover('https://accounts.google.com');

	const client = new googleIssuer.Client({
		client_id: process.env.GOOGLE_CLIENT_ID,
		client_secret: process.env.GOOGLE_CLIENT_SECRET,
		redirect_uris: ['http://localhost:3000/auth/callback'],
		response_types: ['code'],
	});

	passport.use(
		'oidc',
		new Strategy(
			{ client },
			(
				tokenSet: string,
				userinfo: Record<string, string>,
				done: (isDone: null, data: Record<string, string>) => {},
			) => {
				return done(null, {
					id: userinfo.sub,
					email: userinfo.email,
					name: userinfo.name,
					picture: userinfo.picture,
					tokens: tokenSet,
				});
			},
		),
	);
}

// OIDC routes
app.get('/auth/google', passport.authenticate('oidc'));

app.get(
	'/auth/callback',
	passport.authenticate('oidc', {
		successRedirect: '/dashboard',
		failureRedirect: '/login',
	}),
);
*/
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

app.post('/upload', (req: Request, res: Response) => {
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

app.get('/db-setup', async (req: Request, res: Response) => {
	try {
		await executeQuery('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
		await executeQuery(`CREATE TABLE IF NOT EXISTS "users" (
			id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
			"password" VARCHAR(255) NOT NULL,
			"name" VARCHAR(255) NOT NULL,
			"email" VARCHAR(255) NOT NULL,
			"age" INTEGER
		);`);
		await executeQuery(`CREATE TABLE IF NOT EXISTS "products" (
			id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			category VARCHAR(255) NOT NULL
		);`);
		await executeQuery(`CREATE TABLE IF NOT EXISTS "book_store" (
			id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
			title VARCHAR(255),
			author VARCHAR(255),
			issued BOOLEAN NOT NULL DEFAULT TRUE
		);`);
		res.send('Postgres Db setup successfully!');
	} catch (err) {
		logger.warn(`Datanse Error => ${err}`);
		res.status(500).send(`Datanse Error => ${err}`);
	}
});

app.get('/process-csv', (req: Request, res: Response) => {
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

finalHandler(app);
app.use(errorHandler);
