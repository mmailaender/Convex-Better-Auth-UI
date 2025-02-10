import sClient from '$lib/db/serverClient';
import { fql } from 'fauna';
import type { WebAuthnUserCredential } from './passkeys/types';
import { encodeBase64 } from '@oslojs/encoding';
import {
	deleteAccessTokenCookie,
	deleteRefreshTokenCookie,
	invalidateSession,
	invalidateUserSessions
} from './session';
import { type RequestEvent } from '@sveltejs/kit';
import type { SocialProvider, Tokens } from './user';

/**
 * Signs up a user using a social provider.
 *
 * @param {string} firstName - The user's first name.
 * @param {string} lastName - The user's last name.
 * @param {string} email - The user's email address.
 * @param {string} providerUserId - The user's social provider ID.
 * @param {string} providerUserEmail - The user's social provider email.
 * @returns {Promise<Tokens>} The authentication tokens for the user.
 */
export async function signUpWithSocialProvider(
	userData: { firstName: string; lastName: string; email: string; avatar?: string },
	accountData: { providerName: SocialProvider; providerUserId: string; providerUserEmail: string }
): Promise<Tokens> {
	const response = await sClient.query<Tokens>(
		fql`signUpWithSocialProvider( ${userData}, ${accountData} )` 
	);

	return response.data;
}

/**
 * Signs in a user using a social provider.
 *
 * @param {SocialProvider} providerName - The social provider name (e.g., GitHub, Google).
 * @param {string} providerUserId - The user's provider account ID.
 * @returns {Promise<Tokens>} The authentication tokens for the user.
 */
export async function signInWithSocialProvider(
	providerName: SocialProvider,
	providerUserId: string
): Promise<Tokens> {
	const response = await sClient.query<Tokens>(
		fql`signInWithSocialProvider(${providerName}, ${providerUserId})`
	);

	return response.data;
}

/**
 * Signs up a user using a WebAuthn passkey.
 *
 * @param {WebAuthnUserCredential} credential - The user's WebAuthn credential.
 * @param {string} firstName - The user's first name.
 * @param {string} lastName - The user's last name.
 * @param {string} email - The user's email address.
 * @returns {Promise<Tokens>} The authentication tokens for the user.
 */
export async function signUpWithPasskey(
	credential: WebAuthnUserCredential,
	firstName: string,
	lastName: string,
	email: string
): Promise<Tokens> {
	const query = fql`signUpWithPasskey({ id: ${encodeBase64(credential.id)}, userId: ${credential.userId}, algorithmId: ${credential.algorithmId}, publicKey: ${encodeBase64(credential.publicKey)}, otp: ${credential.otp!}}, { firstName: ${firstName}, lastName: ${lastName}, email: ${email} })`;

	const response = await sClient.query<Tokens>(query);
	return response.data;
}

/**
 * Signs in a user using a WebAuthn passkey.
 *
 * @param {string} passkeyId - The user's passkey ID.
 * @returns {Promise<Tokens>} The authentication tokens for the user.
 */
export async function signInWithPasskey(passkeyId: string): Promise<Tokens> {
	const response = await sClient.query<Tokens>(fql`signInWithPasskey(${passkeyId})`);
	return response.data;
}


/**
 * Verifies if a user exists based on their email address.
 *
 * @param {string} email - The user's email address.
 * @returns {Promise<boolean>} True if the user exists, false otherwise.
 */
export async function verifyUserExists(email: string): Promise<boolean> {
	const response = await sClient.query<boolean>(fql`verifyUserExists(${email})`);
	return response.data;
}

/**
 * Verifies if a social account exists for a given provider and account ID.
 *
 * @param {SocialProvider} provider - The social provider name.
 * @param {string} providerAccountId - The account ID on the provider.
 * @returns {Promise<boolean>} True if the social account exists, false otherwise.
 */
export async function verifySocialAccountExists(
	provider: SocialProvider,
	providerAccountId: string
): Promise<boolean> {
	const response = await sClient.query<boolean>(
		fql`verifySocialAccountExists(${provider}, ${providerAccountId})`
	);
	return response.data;
}

/**
 * Creates a verification entry for a user.
 *
 * @param {string} email - The user's email address.
 * @returns {Promise<string>} A verification token.
 */
export async function createVerification(email: string, userId?: string): Promise<string> {
	console.log(`user.server.ts: Creating email ownership verification entry for: ${email} with userId: ${userId}`);
	const res = await sClient.query<string>(
		fql`createVerification({email: ${email}, userId: ${userId ? userId : null}})`
	);
	return res.data;
}

/**
 * Signs out a user by invalidating their session and removing cookies.
 *
 * @param {RequestEvent} event - The incoming request event.
 * @returns {Promise<boolean>} True if the sign-out was successful, false otherwise.
 */
export async function signOut(event: RequestEvent): Promise<boolean> {
	const accessToken = event.cookies.get('access_token');
	if (accessToken) {
		try {
			await invalidateSession(accessToken);
			deleteAccessTokenCookie(event);
			deleteRefreshTokenCookie(event);
			return true;
		} catch (error) {
			console.error('Failed to sign out:', error);
			return false;
		}
	}
	return false;
}

/**
 * Signs out a user from all devices by invalidating all sessions and removing cookies.
 *
 * @param {RequestEvent} event - The incoming request event.
 * @returns {Promise<boolean>} True if the sign-out was successful, false otherwise.
 */
export async function signOutFromAllDevices(event: RequestEvent): Promise<boolean> {
	const accessToken = event.cookies.get('access_token');
	if (accessToken) {
		try {
			await invalidateUserSessions(accessToken);
			deleteAccessTokenCookie(event);
			deleteRefreshTokenCookie(event);
			return true;
		} catch (error) {
			console.error('Failed to sign out from all devices:', error);
			return false;
		}
	}
	return false;
}
