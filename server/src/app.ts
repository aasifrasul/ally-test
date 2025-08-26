import cors from 'cors';
import express, {
	Application,
	Request as ExpressRequest,
	Response,
	NextFunction,
} from 'express';
import helmet from 'helmet';
import { engine } from 'express-handlebars';
import cookieParser from 'cookie-parser';
import serveStatic from 'serve-static';
import bodyParser from 'body-parser';
import { rateLimit } from 'express-rate-limit';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';

const timeout = require('connect-timeout');

import { host, port, isCurrentEnvProd, ALLOWED_ORIGINS } from './envConfigDetails';
import {
	userAgentHandler,
	fetchWineData,
	fetchImage,
	compiledTemplate,
	handleGraphql,
} from './middlewares';
import { handleFileupload } from './fileUploads';
import { setupProxy } from './setupProxy';
import { constructReqDataObject, generateBuildTime } from './helper';
import { pathPublic, pathTemplate, pathRootDir } from './paths';
import { finalHandler } from './globalErrorHandler';
import { constants } from '../../src/constants';

// Import auth components
import { authRoutes } from './routes/authRoutes';
import { authenticateToken, optionalAuth, authorizeRole } from './middlewares/authMiddleware';

interface CustomError extends Error {
	status?: number;
}

interface Request extends ExpressRequest {
	timedout?: boolean;
	id?: string;
	user?: {
		id: string;
		email: string;
		role?: string;
	};
}

const app: Application = express();

generateBuildTime();

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // limit each IP to 100 requests per windowMs
});

// setupGlobalAsyncErrorHandling(app);
handleFileupload(app);

app.all('/graphql', handleGraphql);

setupProxy(app);

function haltOnTimedout(req: Request, res: Response, next: NextFunction) {
	if (!req.timedout) {
		next();
	} else {
		res.status(408).json({ error: 'Request timeout' });
	}
}

// 1. Global middlewares first
app.use(cookieParser());
app.use(userAgentHandler);
app.use(compression());
app.use(
	cors({
		origin: isCurrentEnvProd ? ALLOWED_ORIGINS?.split(',') : `http://${host}:${port}`,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
		credentials: true,
	}),
);

app.use(
	helmet({
		contentSecurityPolicy: isCurrentEnvProd ? undefined : false,
	}),
);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(bodyParser.text());
app.use(timeout('5s'));
app.use(haltOnTimedout);
app.use(limiter);

// 2. Request ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
	req.id = uuidv4();
	next();
});

// 3. Optional auth middleware (before routes that might need it)
app.use(optionalAuth);

// 4. Specific routes first (most specific to least specific)
app.get('/health', async (req: Request, res: Response) => {
	/* ... */
});

// Auth routes
app.use('/auth', authRoutes);

// API routes
app.get('/api/fetchWineData/*', fetchWineData);
app.get('/api/profile', authenticateToken, (req: Request, res: Response) => {
	/* ... */
});
app.get('/api/admin', authenticateToken, authorizeRole('admin'), (req, res) => {
	/* ... */
});

// GraphQL
app.all('/graphql', handleGraphql);

// Image serving
app.get('/images/*', fetchImage);

// Redirects
app.use('/login', (_, res: Response) => {
	res.redirect('/auth/login');
});

// 5. Static files
app.use(
	serveStatic(pathRootDir, {
		index: ['index.hbs', 'default.html', 'default.htm'],
	}),
);

// Set hbs template config
app.engine('.hbs', engine({ extname: '.hbs' }));
app.set('view engine', 'handlebars');
app.set('views', pathTemplate);

const bundleConfig = ['en', 'vendor', 'app'].map((item) => `${pathPublic}/${item}.bundle.js`);

// 6. Dynamic template routes (fix the next() issue)
app.all(['/', '/:route'], (req: any, res: Response, next: NextFunction) => {
	const { route } = req.params;
	if (route && !constants.routes!.includes(route)) {
		return next(); // Add return here!
	}

	const data = {
		js: bundleConfig,
		...constructReqDataObject(req),
		user: req.user,
		dev: true,
		layout: false,
	};
	res.send(compiledTemplate(data));
});

// 7. 404 Handler last
finalHandler(app);

export { app };
