import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';

import { APP_NAME, DEV } from '../webpack/constants.js';
import { pathTemplate, pathPublic } from '../server/paths.js';

// import hbsJson from '../public/ally-test.json' assert { type: 'json' };
//import { template } from '../public/server/hbs.bundle.js';

const writeFile = (name, contents) => {
	console.log(new Date() + ' Build file : ' + name);

	if (!fs.existsSync(pathTemplate)) {
		fs.mkdirSync(pathTemplate);
	}
	fs.writeFileSync(path.join(pathTemplate, name), contents);
};

/*
const fetchBuildConfig = () => {
	return DEV
		? [
				require('../public/' + APP_NAME + '.json'),
				require('../public/server/hbs.bundle.js'),
		  ]
		: [
				require('../build/' + APP_NAME + '/' + APP_NAME + '.json'),
				require('../build/server/hbs.bundle.js'),
		  ];
};
*/

export const generateHBS = async function () {
	// Dynamically import the template function from `hbs.bundle.js`
	const hbsJson = fs.readFileSync(path.resolve(pathPublic, 'ally-test.json'), {
		encoding: 'utf-8',
	});

	const hbsBundle = await import('../public/server/hbs.bundle.js');
	console.log('hbsTemplate -------------------->>>>>>>>>>>>>>', hbsBundle);
	const template = hbsBundle?.default?.template;
	

	const html = template({ ...hbsJson });
	//vconst PROMO_ENV = process.env.PROMO_ENV;
	writeFile(`index.hbs`, html);
};
