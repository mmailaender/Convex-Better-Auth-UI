import { sClient, uClient } from '$lib/db/client';
import { fql, type Document } from 'fauna';
import type { WebAuthnUserCredential } from './passkeys/types';
import { encodeBase64 } from '@oslojs/encoding';
import {
	deleteAccessTokenCookie,
	deleteRefreshTokenCookie,
	invalidateSession,
	invalidateUserSessions
} from './session';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Signs up a user using a social provider.
 *
 * @param {string} githubId - The user's GitHub ID.
 * @param {string} email - The user's email address.
 * @param {string} firstName - The user's first name.
 * @param {string} lastName - The user's last name.
 * @returns {Promise<Tokens>} The authentication tokens for the user.
 */
export async function signUpWithSocialProvider(
	githubId: string,
	email: string,
	firstName: string,
	lastName: string
): Promise<Tokens> {
	const response = await sClient.query<Tokens>(
		fql`signUpWithSocialProvider({ email: ${email}, userId: ${githubId}, provider: "Github", firstName: ${firstName}, lastName: ${lastName} })`
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
 * Signs in a user using a social provider.
 *
 * @param {Provider} provider - The social provider name (e.g., GitHub, Google).
 * @param {string} providerAccountId - The user's provider account ID.
 * @returns {Promise<Tokens>} The authentication tokens for the user.
 */
export async function signInWithSocialProvider(
	provider: Provider,
	providerAccountId: string
): Promise<Tokens> {
	const response = await sClient.query<Tokens>(
		fql`signInWithSocialProvider(${provider}, ${providerAccountId})`
	);

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
 * Retrieves the current user based on the provided access token.
 *
 * @param {string} accessToken - The user's access token.
 * @returns {Promise<User>} The user object.
 */
export async function getUser(accessToken: string): Promise<User> {
	const response = await uClient(accessToken).query<User>(fql`Query.identity()`);
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
 * @param {Provider} provider - The social provider name.
 * @param {string} providerAccountId - The account ID on the provider.
 * @returns {Promise<boolean>} True if the social account exists, false otherwise.
 */
export async function verifySocialAccountExists(
	provider: Provider,
	providerAccountId: string
): Promise<boolean> {
	const response = await sClient.query<boolean>(
		fql`verifySocialAccountExists(${provider}, ${providerAccountId})`
	);
	return response.data;
}

/**
 * Creates a registration entry for a user.
 *
 * @param {string} email - The user's email address.
 * @returns {Promise<string>} A registration token.
 */
export async function createRegistration(email: string): Promise<string> {
	const response = await sClient.query<string>(fql`createRegistration(${email})`);
	return response.data;
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

export type User = Document & {
	firstName: string;
	lastName: string;
	email: string;
	image: string | null;
	accounts: Account[];
};

export type Account = Document & {
	user: User;
	provider: Provider;
	providerAccountId: string;
};

export type Provider = 'Github' | 'Google' | 'Facebook' | 'Passkey';

export type Tokens = {
	access: AccessToken;
	refresh: RefreshToken;
};

export type AccessToken = Document & {
	document: User;
	secret: string | null;
	data: {
		type: 'access';
		refresh: RefreshToken;
	};
};

export type RefreshToken = Document & {
	document: User;
	secret: string | null;
	data: {
		type: 'refresh';
	};
};
