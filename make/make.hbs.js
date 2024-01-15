const path = require('path');
const fs = require('fs');
const { APP_NAME, DEV } = require('../webpack/constants');

const writeFile = (name, contents) => {
	console.log(new Date() + ' Build file : ' + name);
	const buildDir = DEV ? 'public' : 'build';
	const templatePath = path.join(__dirname, '..', buildDir, 'ally-test');
	if (!fs.existsSync(templatePath)) {
		fs.mkdirSync(templatePath);
	}
	fs.writeFileSync(path.join(templatePath, name), contents);
};

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

const generateHBS = function () {
	const [hbsJson, hbsTemplate] = fetchBuildConfig();
	const html = hbsTemplate.template({ ...hbsJson });
	//vconst PROMO_ENV = process.env.PROMO_ENV;
	writeFile(`index.hbs`, html);
};

module.exports = {
	generateHBS: generateHBS,
};
