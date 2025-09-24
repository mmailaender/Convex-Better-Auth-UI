export const AUTH_CONSTANTS: AuthConstants = {
	providers: {
		password: true
	}
};

export type AuthConstants = {
	providers: {
		github?: boolean;
		google?: boolean;
		facebook?: boolean;
		apple?: boolean;
		atlassian?: boolean;
		discord?: boolean;
		figma?: boolean;
		line?: boolean;
		huggingface?: boolean;
		kakao?: boolean;
		kick?: boolean;
		paypal?: boolean;
		salesforce?: boolean;
		slack?: boolean;
		notion?: boolean;
		naver?: boolean;
		tiktok?: boolean;
		twitch?: boolean;
		x?: boolean;
		dropbox?: boolean;
		linear?: boolean;
		gitlab?: boolean;
		reddit?: boolean;
		roblox?: boolean;
		spotify?: boolean;
		vk?: boolean;
		zoom?: boolean;
		keypass?: boolean;
		password?: boolean;
		emailOTP?: boolean;
		magicLink?: boolean;
	};
	organizations?: boolean;
	validateEmails?: boolean;
	sendEmails?: boolean;
	terms?: string;
	privacy?: string;
};
