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

export const isEmpty = (data) => isUndefined(data) || isNull(data) || data === '';

export const arraySize = (arr) => (isArray(arr) && arr.length) || null;

export const safelyExecuteFunction = (func, context, ...params) => {
	if (typeof func !== 'function') {
		console.log('Please pass a valid function!');
		return;
	}

	if (isObject(context)) {
		return func.apply(context, params);
	}

	return func(...params);
};
