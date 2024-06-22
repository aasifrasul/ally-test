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

export const arraySize = (arr) => (isArray(arr) && arr.length) || null;

export const isEmpty = (data) => {
	if (isUndefined(data)) {
		return true;
	}

	if (isNull(data)) {
		return true;
	}

	if (isString(data) && data.length === 0) {
		return true;
	}

	if (isArray(data) && data.length === 0) {
		return true;
	}

	if (isObject(data) && Object.keys(data).length === 0) {
		return true;
	}

	return false;
};

export const safelyExecuteFunction = (func, context, ...params) => {
	if (!isFunction(func)) {
		console.log('Please pass a valid function!');
		return;
	}

	if (isObject(context)) {
		return func.apply(context, params);
	}

	return func(...params);
};

export function safeExecute(callback) {
	return new Promise((resolve, reject) => {
		try {
			const result = safelyExecuteFunction(callback, null) || callback;

			// Check if the result is a promise
			if (isPromise(result)) {
				result.then(resolve).catch(reject);
			} else {
				resolve(result); // Resolve with the result directly
			}
		} catch (error) {
			console.error('An error occurred:', error);
			reject(error); // Reject the promise with the error
		}
	});
}
