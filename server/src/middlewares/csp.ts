export const csp = {
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'", 'unpkg.com'],
			styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
			fontSrc: ["'self'", 'fonts.gstatic.com'],
			connectSrc: [
				"'self'",
				'fonts.googleapis.com',
				'fonts.gstatic.com',
				'okrcentral.github.io',
				'mocki.io',
				'newsapi.org',
			],
		},
	},
};
