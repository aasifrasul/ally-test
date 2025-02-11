export const csp = {
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			scriptSrc: [
				"'self'",
				"'unsafe-eval'",
				"'unsafe-inline'",
				'*.tailwindcss.com',
				'randomuser.me',
				'unpkg.com',
				'*.ondigitalocean.app',
			],
			styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
			fontSrc: ["'self'", 'fonts.gstatic.com'],
			connectSrc: [
				"'self'",
				'fonts.googleapis.com',
				'fonts.gstatic.com',
				'okrcentral.github.io',
				'mocki.io',
				'newsapi.org',
				'*.tailwindcss.com',
				'*.ondigitalocean.app',
				'*.typicode.com',
			],
		},
	},
};
