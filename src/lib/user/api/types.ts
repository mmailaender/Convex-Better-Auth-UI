import { type } from 'arktype';

export const profileData = type({
	firstName: 'string',
	lastName: 'string',
	'avatar?': 'string | undefined'
});
export type ProfileData = typeof profileData.infer;

export const verifyEmailAndSendVerificationData = type({
	email: 'string',
	userId: 'string | undefined'
});
export type VerifyEmailAndSendVerificationData = typeof verifyEmailAndSendVerificationData.infer;

export const verifyEmailAndSendVerificationReturnData = type({
	message: 'string',
	verified: {
		valid: 'boolean',
		exists: 'boolean',
		'reason?': 'string | undefined'
	},
	email: 'string'
});
export type VerifyEmailAndSendVerificationReturnData =
	typeof verifyEmailAndSendVerificationReturnData.infer;

export const addEmailData = type({
	email: 'string',
	verificationOTP: 'string'
});
export type AddEmailData = typeof addEmailData.infer;

export const createPasskeyAccountData = type({
	userId: 'string',
	encodedAttestationObject: 'string',
	encodedClientDataJSON: 'string'
});
export type CreatePasskeyAccountData = typeof createPasskeyAccountData.infer;

export const cancelEmailVerificationData = type('string');
export type CancelEmailVerificationData = typeof cancelEmailVerificationData.infer;
