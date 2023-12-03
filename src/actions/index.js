import React from 'react';

let dispatch;

window.addEventListener('customDispatch', (e) => {
	dispatch = e.detail.dispatch;
});

const sendDispatch = (schema, type, payload) => dispatch({ schema, type, payload });

export const fetchStarted = (schema) => sendDispatch(schema, 'FETCH_INIT');
export const fetchSucceeded = (schema, payload) =>
	sendDispatch(schema, 'FETCH_SUCCESS', payload);
export const fetchFailed = (schema) => sendDispatch(schema, 'FETCH_FAILURE');
export const fetchCompleted = (schema) => sendDispatch(schema, 'FETCH_COMPLETE');

export const updateStarted = (schema) => sendDispatch(schema, 'UPDATE_INIT');
export const updateSucceeded = (schema) => sendDispatch(schema, 'UPDATE_SUCCESS');
export const updateFailed = (schema) => sendDispatch(schema, 'UPDATE_FAILURE');
export const updateCompleted = (schema) => sendDispatch(schema, 'UPDATE_COMPLETE');

export const advancePage = (schema, payload) => sendDispatch(schema, 'ADVANCE_PAGE', payload);
