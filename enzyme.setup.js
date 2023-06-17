// setup file
const { configure } = require('enzyme');
//const { TextEncoder } = require('text-encoding');
const Adapter = require('@wojtekmaj/enzyme-adapter-react-17');

/*
// Polyfill TextEncoder if it's not defined
if (typeof TextEncoder === 'undefined') {
	global.TextEncoder = TextEncoder;
}
*/

configure({ adapter: new Adapter() });
