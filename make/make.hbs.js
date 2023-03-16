import path from 'path';
import fs from 'fs';

import { APP_NAME, DEV } from '../webpack/constants.js';
import devAppJson from '../public/ally-test.json' assert { type: 'json' };
// import prodAppJson from '../public/ally-test/ally-test.json' assert { type: 'json' };
import {hbsBundle} from '../public/server/hbs.bundle.js';

const writeFile = (name, contents) => {
	console.log(new Date() + ' Build file : ' + name);
	const buildDir = DEV ? 'public' : 'build';
	const templatePath = path.resolve('..', buildDir, 'ally-test');
	if (!fs.existsSync(templatePath)) {
		fs.mkdirSync(templatePath);
	}
	fs.writeFileSync(path.resolve(templatePath, name), contents);
};

const fetchBuildConfig = () => {
	return [devAppJson, hbsBundle];
};

const generateHBS = () => {
	const [hbsJson, hbsTemplate] = fetchBuildConfig();
	const html = hbsTemplate.template({ ...hbsJson });
	const PROMO_ENV = process.env.PROMO_ENV;
	writeFile(`${PROMO_ENV}-${APP_NAME}.hbs`, html);
};

export { generateHBS };
