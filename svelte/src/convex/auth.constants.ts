export const AUTH_CONSTANTS: AuthConstants = {
	providers: {
		password: true
	},
	validateEmails: true,
	organizations: true,
	terms: '#',
	privacy: '#'
};

export type AuthConstants = {
	providers: {
		github?: boolean;
		google?: boolean;
		facebook?: boolean;
		apple?: boolean;
		microsoft?: boolean;
		keypass?: boolean;
		password?: boolean;
		emailOTP?: boolean;
		magicLink?: boolean;
	};
	organizations?: boolean;
	terms?: string;
	privacy?: string;
	validateEmails?: boolean;
};
