import type { Request } from 'express';

export const convertExpiryToSeconds = (expiry: string): number => {
	const match = expiry.match(/^(\d+)([smhd])$/);
	if (!match) return 900; // default 15 minutes

	const value = parseInt(match[1]);
	const unit = match[2];
	const multipliers: Record<string, number> = {
		s: 1,
		m: 60,
		h: 3600,
		d: 86400,
	};

	return value * (multipliers[unit] || 60);
};

export const getClientType = (req: Request): 'web' | 'mobile' | 'api' => {
	const userAgent = req.headers['user-agent']?.toLowerCase() || '';
	const clientType = req.headers['x-client-type'] as string;

	if (clientType === 'web' || clientType === 'mobile' || clientType === 'api')
		return clientType;

	if (
		userAgent.includes('mobile') ||
		userAgent.includes('android') ||
		userAgent.includes('iphone')
	)
		return 'mobile';

	if (
		req.headers['x-api-key'] ||
		req.headers['content-type']?.includes('application/json')
	) {
		const acceptsHtml = req.headers.accept?.includes('text/html');
		if (!acceptsHtml) return 'api';
	}

	return 'web';
};
