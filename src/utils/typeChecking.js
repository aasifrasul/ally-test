const isType = (data, type) => Object.prototype.toString.call(data).slice(8, -1).toLowerCase() === type;

const isFunction = (data) => isType(data, 'function');
const isArray = (data) => isType(data, 'array');
const isObject = (data) => isType(data, 'object');
const isNull = (data) => isType(data, 'null');
const isUndefined = (data) => isType(data, 'undefined');
const isNumber = (data) => isType(data, 'number');
const isString = (data) => isType(data, 'string');
const isBoolean = (data) => isType(data, 'boolean');
const isMap = (data) => isType(data, 'map');
const isSet = (data) => isType(data, 'set');
const isGeneratorFunction = (data) => isType(data, 'generatorfunction');
const isPromise = (data) => isType(data, 'promise');
const isDate = (data) => isType(data, 'date');

const getArrayCount = (arr) => isArray(arr) && arr.length;

const safelyExecuteFunction = (...params) => {
	const func = params.shift();
	const context = params.shift();
	if (!isFunction(func)) {
		return null;
	}

	if (isObject(context) && isFunction(context[func.name])) {
		return func.apply(context, params);
	}

	return func(...params);
};

module.exports = {
	isFunction,
	isArray,
	isObject,
	isNull,
	isUndefined,
	isNumber,
	isString,
	isBoolean,
	getArrayCount,
	safelyExecuteFunction,
};
