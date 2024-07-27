export const typeCheck = (data, type) =>
	Object.prototype.toString.call(data).slice(8, -1).toLowerCase() === type;

export const isAsyncfunction = (data) => typeCheck(data, 'asyncfunction');
export const isFunction = (data) => typeCheck(data, 'function');
export const isArray = (data) => typeCheck(data, 'array');
export const isObject = (data) => typeCheck(data, 'object');
export const isNull = (data) => typeCheck(data, 'null');
export const isUndefined = (data) => typeCheck(data, 'undefined');
export const isNumber = (data) => typeCheck(data, 'number');
export const isString = (data) => typeCheck(data, 'string');
export const isBoolean = (data) => typeCheck(data, 'boolean');
export const isMap = (data) => typeCheck(data, 'map');
export const isSet = (data) => typeCheck(data, 'set');
export const isGeneratorFunction = (data) => typeCheck(data, 'generatorfunction');
export const isPromise = (data) => typeCheck(data, 'promise');
export const isDate = (data) => typeCheck(data, 'date');
export const isSymbol = (data) => typeCheck(data, 'symbol');
export const isRegExp = (data) => typeCheck(data, 'regexp');

export const arraySize = (arr) => (isArray(arr) ? arr.length : null);

export const isEmptyString = (str) => isString(str) && str.length === 0;
export const isEmptyArray = (arr) => arraySize(arr) === 0;
export const isEmptyObject = (obj) => isObject(obj) && Object.keys(obj).length === 0;

export const isEmpty = (data) =>
	isUndefined(data) ||
	isNull(data) ||
	isEmptyString(data) ||
	isEmptyArray(data) ||
	isEmptyObject(data);

export const safelyExecuteFunction = (func, context, ...params) => {
	if (!isFunction(func)) {
		console.log('Please pass a valid function!');
		return;
	}

	return isObject(context) ? func.apply(context, params) : func(...params);
};

export function safeExecute(callback, ...params) {
	return new Promise((resolve, reject) => {
		try {
			const result = safelyExecuteFunction(callback, null, ...params) || callback;
			isPromise(result) ? result.then(resolve).catch(reject) : resolve(result);
		} catch (error) {
			console.error('An error occurred:', error);
			reject(error);
		}
	});
}
