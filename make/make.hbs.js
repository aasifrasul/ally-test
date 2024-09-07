const path = require('path');
const fs = require('fs-extra');
const { pathTemplate, pathPublic } = require('../server/src/paths');
const { APP_NAME, DEV } = require('../webpack/constants');

const writeFile = (name, contents) => {
	console.log(new Date() + ' Build file : ' + name);
	const buildDir = DEV ? 'public' : 'build';
	if (!fs.existsSync(pathTemplate)) {
		fs.mkdirSync(pathTemplate);
	}
	fs.writeFileSync(path.join(pathTemplate, name), contents);
};

const fetchBuildConfig = () => {
	return DEV
		? [
				require(path.join(pathPublic, `${APP_NAME}.json`)),
				require(path.join(pathPublic, 'server', 'src', `hbs.bundle.js`)),
			]
		: [
				require('../build/' + APP_NAME + '/' + APP_NAME + '.json'),
				require('../build/server/src/hbs.bundle.js'),
			];
};

const generateHBS = () => {
	const [hbsJson, hbsTemplate] = fetchBuildConfig();
	const html = hbsTemplate.template({ ...hbsJson });
	//vconst PROMO_ENV = process.env.PROMO_ENV;
	writeFile(`index.hbs`, html);
};

module.exports = {
	generateHBS,
};
