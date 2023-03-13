const parser = require('ua-parser-js');
const { getArrayCount } = require('../src/utils/ArrayUtils');

// Retail Wrapper Android App
const RETAIL_WRAPPER_ANDROID_APP = 'flipkart_app';
// Retail Native Android App
const RETAIL_NATIVE_ANDROID_APP = 'fk_android_app';
// Retail Native IOS App
const RETAIL_NATIVE_IOS_APP = 'fk_ios_app';
// Flipkart User Agent
const FLIPKART_USER_AGENT = 'FKUA';

const ALLOWED_WORD_FORMAT_REGEX = '[a-zA-z0-9-. ]*';
// var APP_DEVICE_ID_ALLOWED_WORD_FORMAT_REGEX = "[a-zA-z0-9-.+,| ]*";

const FKUA_APP_REGEX = new RegExp(
	`FKUA/(${ALLOWED_WORD_FORMAT_REGEX})/((\\d+\\.)*\\d+)?/(${ALLOWED_WORD_FORMAT_REGEX})/(${ALLOWED_WORD_FORMAT_REGEX})(( \\(.*\\))|.*)`,
);
// var RETAIL_NATIVE_ANDROID_APP_REGEX = new RegExp(
//   "appVersion:(\\d*) fk_android_app"
// );

const getPossibleFkAgentString = () => {
	const stringObj = Object.create(null);
	stringObj.RETAIL_WRAPPER_ANDROID_APP = RETAIL_WRAPPER_ANDROID_APP;
	stringObj.RETAIL_NATIVE_ANDROID_APP = RETAIL_NATIVE_ANDROID_APP;
	stringObj.FLIPKART_USER_AGENT = FLIPKART_USER_AGENT;
	stringObj.RETAIL_NATIVE_IOS_APP = RETAIL_NATIVE_IOS_APP;
	return stringObj;
};

const getFkString = (fkAgentString) => {
	const possibleFkAgentString = getPossibleFkAgentString();
	for (const key in possibleFkAgentString) {
		if (fkAgentString.includes(possibleFkAgentString[key])) {
			return possibleFkAgentString[key];
		}
	}
	return null;
};

const parse = (userAgent) => {
	const uaParsedObj = parser(userAgent);
	const fkAgentString = getFkString(userAgent);

	let type = '',
		version = '',
		platform = '',
		matches = '',
		device = '';
	if (fkAgentString) {
		switch (fkAgentString) {
			case RETAIL_NATIVE_ANDROID_APP:
				type = 'Retail';
				platform = 'Android';
				device = 'Mobile';
				matches = userAgent.match(FKUA_APP_REGEX);
				if (getArrayCount(matches)) {
					version = matches[2];
				}
				break;
			case FLIPKART_USER_AGENT:
				matches = userAgent.match(FKUA_APP_REGEX);
				if (getArrayCount(matches)) {
					type = matches[1];
					version = matches[2];
					platform = matches[4];
					device = matches[5];
				}
				if (platform === 'WP') {
					platform = 'Windows';
				}
				break;
			case RETAIL_NATIVE_IOS_APP:
				type = 'Retail';
				platform = 'iOS';
				device = 'Mobile';
				break;
			case RETAIL_WRAPPER_ANDROID_APP:
				type = 'Retail Wrapper';
				platform = 'Android';
				device = 'Mobile';
				break;
		}
	}
	const fkApp = Object.create(null);
	fkApp.type = type;
	fkApp.platform = platform;
	fkApp.device = device;
	fkApp.version = version;
	uaParsedObj.fkApp = fkApp;
	return uaParsedObj;
};

module.exports = {
	parse,
};
