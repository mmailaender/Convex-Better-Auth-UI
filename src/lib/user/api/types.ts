import { type } from 'arktype';

export const profileData = type({
	firstName: 'string',
	lastName: 'string',
	'avatar?': 'string | undefined'
});
export type ProfileData = typeof profileData.infer;

export const verifyEmailData = type({
	email: 'string',
	userId: 'string'
});
export type VerifyEmailData = typeof verifyEmailData.infer;

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
