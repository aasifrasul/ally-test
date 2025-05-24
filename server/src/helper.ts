import fs from 'fs';
import xss from 'xss';

import { isCurrentEnvProd } from './envConfigDetails';
import { pathBuildTime } from './paths';

interface EncOptions {
	encoding?: string;
}

const enc: EncOptions = {
	encoding: 'utf-8',
};

interface UaData {
	fkApp?: {
		platform?: string;
		version?: string;
		string?: string;
	};
}

const getPlatformString = (uaData: UaData): string => {
	return uaData?.fkApp?.platform?.toLowerCase() || 'web';
};

const isMobileApp = (uaData: UaData): boolean => {
	const platforms = ['android', 'ios', 'windows'];
	return platforms.includes(getPlatformString(uaData));
};

const getAppEnvironment = (req: any): string => {
	return JSON.stringify(
		isMobileApp(req.userAgentData) === true ? _getAppParams(req) : _getWebEnvParams(req),
	);
};

const _getAppParams = (request: any): Record<string, any> => {
	const { platform = '', version, string } = request.userAgentData?.fkApp || {};
	if (!platform) {
		throw new Error('InvalidUserAgentObject');
	}
	const appEnvironment = {
		platform: platform.toLowerCase(),
		appVersion: version,
		fkUA: string,
	};
	return { ...appEnvironment, ..._getLoginParams(request) };
};

const _getWebEnvParams = (req: any): Record<string, any> => {
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

const _getLoginParams = (request: any): Record<string, any> => ({
	omnitureVisitorId: _getValueFromHeaderAndParam(request, 'appVisitorId'),
	SN: _getValueFromHeaderAndParam(request, '_sn_') || _getValueFromCookie(request, 'SN'),
	SC: _getValueFromHeaderAndParam(request, '_sc_') || _getValueFromCookie(request, 'SC'),
	secureToken: _getValueFromHeaderAndParam(request, 'secureToken'),
});

const _getValueFromHeaderAndParam = (request: any, paramName: string): any => {
	if (paramName in request.body) {
		return getParsedUserAgentData(request.body[paramName]);
	} else if (paramName in request.headers) {
		return getParsedUserAgentData(request.headers[paramName]);
	}
};

const constructReqDataObject = (req: any): Record<string, any> => {
	const data: Record<string, any> = {};
	data.appEnvDetails = getAppEnvironment(req);
	data.nonce = req.nonce;
	data.locale = req.fkLocale;
	return data;
};

const _getValueFromCookie = (request: any, paramName: string): any => {
	return (
		request.cookies &&
		request.cookies[paramName] &&
		getParsedUserAgentData(request.cookies[paramName])
	);
};

const generateBuildTime = async (): Promise<void> => {
	try {
		await fs.promises.writeFile(pathBuildTime, new Date().toUTCString());
	} catch (err) {
		console.error('Error occurred while writing to generateBuildTime:', err);
	}
};

const getStartTime = (): string => {
	if (!isCurrentEnvProd) {
		return getFileContents(pathBuildTime);
	}

	const startTime: string = getFileContents(pathBuildTime);
	return new Date(Date.parse(startTime) + 1000000000).toUTCString();
};

const nocache = (res: any): void => {
	res.set({
		'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
		Expires: 'Thu, 01 Jan 1970 00:00:00 GMT',
		Pragma: 'no-cache',
		'Last-Modified': getStartTime(),
	});
};

const getParsedUserAgentData = (userAgentData: string): string => xss(userAgentData);

const getFileContentsAsync = async <T>(filePath: string): Promise<T> => {
	try {
		await fs.promises.stat(filePath);
		const data = await fs.promises.readFile(filePath, 'utf-8');
		return data as unknown as T;
	} catch (error) {
		const errorType = error instanceof Error ? error.message : String(error);
		throw new Error(`Error reading file ${filePath}: ${errorType}`);
	}
};

const getFileContents = <T>(filePath: string): T => {
	try {
		fs.stat(filePath, (err, stats) => {
			if (err) {
				throw new Error(`Error reading file ${filePath}: ${err.message}`);
			}
		});
		return fs.readFileSync(filePath, 'utf-8') as T;
	} catch (error) {
		const errorType = error instanceof Error ? error.message : String(error);
		throw new Error(`Error reading file ${filePath}: ${errorType}`);
	}
};

const readJson = async <T>(filePath: string): Promise<T> => {
	try {
		await fs.promises.stat(filePath);
		const fileContents = await fs.promises.readFile(filePath, 'utf-8');
		return JSON.parse(fileContents) as T;
	} catch (error) {
		const errorType = error instanceof Error ? error.message : String(error);
		throw new Error(`Error reading or parsing JSON file ${filePath}: ${errorType}`);
	}
};

const safeStringify = (obj: any): string => {
	function replacer(key: string, value: any): any {
		if (key === 'stack') return undefined;
		if (value === obj) return '[Circular]';
		if (value instanceof RegExp) return String(value);
		if (Array.isArray(value)) return value.map((ele: any) => ele);
		if (typeof value === 'object' && value !== null) {
			if (seen.has(value)) return;
			seen.add(value);
		}
		return value;
	}

	const seen = new Set();
	const root = obj;

	return JSON.stringify(obj, replacer);
};

export {
	isMobileApp,
	constructReqDataObject,
	generateBuildTime,
	getStartTime,
	nocache,
	getParsedUserAgentData,
	getFileContents,
	readJson,
	safeStringify,
};
