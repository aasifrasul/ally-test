import winston from 'winston';
const { format } = winston;
const { combine, label, json } = format;

//
// Configure the logger for `category1`
//
winston.loggers.add('category1', {
	format: combine(label({ label: 'category one' }), json()),
	transports: [
		new winston.transports.Console({ level: 'silly' }),
		new winston.transports.File({ filename: 'somefile.log' }),
	],
});

//
// Configure the logger for `category2`
//
winston.loggers.add('category2', {
	format: combine(label({ label: 'category two' }), json()),
	transports: [new winston.transports.Http({ host: 'localhost', port: 8080 })],
});

const category1 = winston.loggers.get('category1');
const category2 = winston.loggers.get('category2');

export { category1, category2 };
