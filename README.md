# ally-test

yarn install

To build : yarn build;

To start the server: yarn start

Once the server has started open in a new tab 'http://localhost:3100/' to access the application

It will show all the landing pages, click on any to traverse.

#Code Structure

This application is built on the lines of a framework on top of React.
There are 4 aspects to it.

1. It providea a tool similar to redux to manage the state, but without the boilerplate code.
   Just define a new entry in the src/utils/Constants.js file under dataFetchModules. e.g. infiniteScroll.
   you will also need to define your reducer (how do you want to handle the data after a successfull fetch).
   Rest everything will be wired to your Componenet. You just need to Wrap it in with ConnectDataFetch e.g. src/components/InfiniteScroll/InfiniteScroll.js
   You might need additnola data and thats where you can define it in mapStateToProps/mapDispatchToProps

2. It provides a small but robust hook (useFetch) to fetch API data. All the fetch calls are delegated to Web Workers to keep the main thread free.
   In addition it can be extended if required to offload expensive compution from the main thread.
   This complements the point 1.

3. It has a form generator wherein you just define a json file and pass it to the Form generator function and it renders the form without writing a single line of code.
   e.g. src/components/SearchForm/index.js From is geberated from a json file. Yje idea is to change the from structure without any code change/commit on the FE.
   Of course for this to happen the json data has to flow from some API.

4. It provides some handy utlity functions src/utils/typeChecking.js like isFunction/isPromise/isObject and a function which safely executes a callback function with checks for presence etc.
   A lot of these could be avoided by Typescript, but there might be still some usecases for it.
