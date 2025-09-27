import { AuthConstants } from './auth.constants.types';

export const AUTH_CONSTANTS: AuthConstants = {
	providers: {
		github: true,
		google: true,
		password: true
	},
	organizations: true,
	sendEmails: true,
	validateEmails: true
};
