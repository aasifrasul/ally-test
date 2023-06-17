const { ArrayBuffer, TextDecoder, TextEncoder, Uint8Array } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
//global.ArrayBuffer = ArrayBuffer;
//global.Uint8Array = Uint8Array;
