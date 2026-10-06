import express, { Application } from 'express';
import { engine } from 'express-handlebars';

import { isProdEnv } from '../envConfigDetails';
import { pathDist, pathRootDir, pathTemplate } from '../paths';

export function configureStaticAssets(app: Application): void {
	if (isProdEnv) {
		app.use('/public', express.static(pathDist));
		app.use(express.static(pathRootDir, { index: false }));
		return;
	}

	app.use('/public', (req, res, next) => {
		if (req.path && req.path.endsWith('.ts')) {
			res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
		}
		next();
	});

	app.use(
		express.static(pathRootDir, {
			index: false,
			setHeaders: (res, path) => {
				if (path.includes('/public/')) {
					return false;
				}
			},
		}),
	);
}

export function configureTemplateRendering(app: Application): void {
	app.engine('.hbs', engine({ extname: '.hbs' }));
	app.set('view engine', 'handlebars');
	app.set('views', pathTemplate);
}
