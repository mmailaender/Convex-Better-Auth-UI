import type { AuthConstants } from './auth.constants.types';

export const AUTH_CONSTANTS: AuthConstants = {
	providers: {
		password: true,
		github: true,
		emailOTP: true,
		magicLink: true
	},
	organizations: true,
	sendEmails: true,
	deviceAuthorization: true,
	apiKeys: true,
	admin: true,
	brandName: 'self hosted Auth',
	brandTagline: 'Plug & Play Auth Widgets for your application.'
};
