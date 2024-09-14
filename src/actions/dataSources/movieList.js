import React from 'react';

import * as all from '.';

const schema = 'movieList';

export const fetchData = all.fetchData.bind(null, schema);
export const getList = all.getList.bind(null, schema);
export const fetchNextPage = all.fetchNextPage.bind(null, schema);
