/**
 * File contains list of utilities for handling configs and rendering the page
 */
import fs from 'fs';
import idx from 'idx';
import htmlEncode from 'htmlencode';

import { pathBuildTime } from './paths.js';

const enc = {
	encoding: 'utf-8',
};

/**
 * Returns the current platform string (android/ios/windows)
 * @param uaData
 * @returns {*}
 */
export const getPlatformString = (uaData) =>
	idx(uaData, (_) => _.fkApp.platform.toLowerCase()) || 'web';

/**
 * Return if its mobile app
 * @param uaData
 * @returns {boolean}
 */
export const isMobileApp = (uaData) =>
	['android', 'ios', 'windows'].includes(getPlatformString(uaData));

/**
 * Returns the app environment config
 * @param {*} req
 * @param {*} appName
 */
export const getAppEnvironment = (req) =>
	JSON.stringify(
		isMobileApp(req.userAgentData) === true ? _getAppParams(req) : _getWebEnvParams(req)
	);

/**
 * Returns data passed from app
 * @private
 */
const _getAppParams = (request) => {
	const {
		platform = '',
		version,
		string: fkUA,
	} = idx(request, (_) => _.userAgentData.fkApp) || {};
	!platform && errorLogger.error('InvalidUserAgentObject', platform);
	const appEnvironment = {
		platform: platform.toLowerCase(),
		appVersion: version,
		fkUA,
	};
	return { ...appEnvironment, ..._getLoginParams(request) };
};

/**
 * Returns data for msite (sn and sc got from mapi upstream call)
 * @param req
 * @private
 */
const _getWebEnvParams = (req) => {
	const { cookies, fkUA, fkLocale, nonce, abConfig } = req;
	const { SN, SC } = cookies;
	return {
		SN,
		SC,
		fkUA,
		fkLocale,
		platform: 'web',
		isLoggedIn: !!req.isLoggedIn,
		nonce,
		abConfig,
	};
};

/**
 * Gets list of params required for richviews from request
 * @param request
 * @returns {{omnitureVisitorId: *, SN: *, SC: *, secureToken: *}}
 * @private
 */
const _getLoginParams = (request) => ({
	omnitureVisitorId: _getValueFromHeaderAndParam(request, 'appVisitorId'),
	SN: _getValueFromHeaderAndParam(request, '_sn_') || _getValueFromCookie(request, 'SN'),
	SC: _getValueFromHeaderAndParam(request, '_sc_') || _getValueFromCookie(request, 'SC'),
	secureToken: _getValueFromHeaderAndParam(request, 'secureToken'),
});

/**
 * Returns a given parameter value either from header or from request body
 * @param request
 * @param paramName
 * @returns {*}
 * @private
 */
const _getValueFromHeaderAndParam = function (request, paramName) {
	if (paramName in request.body) {
		return getParsedUserAgentData(request.body[paramName]);
	} else if (paramName in request.headers) {
		return getParsedUserAgentData(request.headers[paramName]);
	}
};

/**
 * Returns the object which will populate the runtime values in hbs
 * @param request
 * @returns {*}
 */
export const constructReqDataObject = (req) => {
	const data = {};
	data.appEnvDetails = getAppEnvironment(req);
	data.nonce = req.nonce;
	data.locale = req.fkLocale;
	return data;
};

/**
 * Get value from cookie
 * @param request
 * @param paramName
 * @returns {*}
 * @private
 */
const _getValueFromCookie = (request, paramName) =>
	request.cookies &&
	request.cookies[paramName] &&
	getParsedUserAgentData(request.cookies[paramName]);

export const generateBuildTime = async function () {
	fs.writeFile(
		pathBuildTime,
		new Date().toUTCString(),
		(err) =>
			err &&
			error('Error occured while writing to generateBuildTime :: ' + err.toString())
	);
};

export const getStartTime = () => {
	if (process.env.NODE_ENV !== 'production') {
		return getFileContents(pathBuildTime);
	}

	let startTime = getFileContents(pathBuildTime);
	startTime = new Date(Date.parse(startTime) + 1000000000).toUTCString();
	return startTime;
};

// Last modified header
// Assumtion here is that the everytime any file is modified, the build is restarted hence last-modified == build time.
export const nocache = (res) =>
	res.set({
		'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
		Expires: 'Thu, 01 Jan 1970 00:00:00 GMT',
		Pragma: 'no-cache',
		'Last-Modified': getStartTime(),
	});

export const getParsedUserAgentData = (userAgentData) => htmlEncode.XSSEncode(userAgentData);
export const getFileContents = (filePath) => fs.readFileSync(filePath, enc);
