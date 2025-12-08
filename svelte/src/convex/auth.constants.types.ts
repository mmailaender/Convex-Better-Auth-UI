type ProviderFlags = {
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
	password?: boolean;
};

export type AuthConstants =
	| {
			providers: ProviderFlags & {
				emailOTP?: false;
				magicLink?: false;
			};
			sendEmails?: false; // if false, no email features allowed
			validateEmails?: boolean;
			organizations?: false;
			apiKeys?: boolean;
			deviceAuthorization?: boolean;
			terms?: string;
			privacy?: string;
	  }
	| {
			providers: ProviderFlags & {
				emailOTP?: boolean;
				magicLink?: boolean;
			};
			sendEmails: true; // required if using emailOTP, magicLink or organizations
			validateEmails?: boolean;
			organizations?: boolean;
			apiKeys?: boolean;
			deviceAuthorization?: boolean;
			terms?: string;
			privacy?: string;
	  };
