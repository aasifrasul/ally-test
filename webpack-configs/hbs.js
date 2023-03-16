import template from '../templates/index.hbs';

const helper = {
	if_eq: (a, b, opt) => {
		return opt.fn({});
	},
};

export { template, helper };
