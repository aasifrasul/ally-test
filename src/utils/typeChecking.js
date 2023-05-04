const typeCheck = (data, type) =>
	Object.prototype.toString.call(data).slice(8, -1).toLowerCase() === type;

const isFunction = (data) => typeCheck(data, 'function');
const isArray = (data) => typeCheck(data, 'array');
const isObject = (data) => typeCheck(data, 'object');
const isNull = (data) => typeCheck(data, 'null');
const isUndefined = (data) => typeCheck(data, 'undefined');
const isNumber = (data) => typeCheck(data, 'number');
const isString = (data) => typeCheck(data, 'string');
const isBoolean = (data) => typeCheck(data, 'boolean');
const isMap = (data) => typeCheck(data, 'map');
const isSet = (data) => typeCheck(data, 'set');
const isGeneratorFunction = (data) => typeCheck(data, 'generatorfunction');
const isPromise = (data) => typeCheck(data, 'promise');
const isDate = (data) => typeCheck(data, 'date');
const isEmpty = (data) => isUndefined(data) || isNull(data) || data === '';
const isSymbol = (data) => typeCheck(data, 'symbol');

const safelyExecuteFunction = (func, context, ...params) => {
	if (!isFunction(func)) {
		return null;
	}

	if (isObject(context) && isFunction(context[func.name])) {
		return func.apply(context, params);
	}

	return func(...params);
};

module.exports = {
	isMap,
	isSymbol,
	isSet,
	isGeneratorFunction,
	isPromise,
	isDate,
	isEmpty,
	isFunction,
	isArray,
	isObject,
	isNull,
	isUndefined,
	isNumber,
	isString,
	isBoolean,
	safelyExecuteFunction,
};
