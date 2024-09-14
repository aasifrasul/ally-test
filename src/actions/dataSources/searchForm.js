import React from 'react';

import * as all from '.';

const schema = 'searchForm';

export const fetchData = all.fetchData.bind(null, schema);
export const getList = all.getList.bind(null, schema);
export const addItem = all.addItem.bind(null, schema);
