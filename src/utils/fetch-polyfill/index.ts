export { fetch } from './fetch';
export { type BodyInit } from './types';

// Type assertion for the polyfill property
(fetch as unknown as { polyfill: boolean }).polyfill = true;
