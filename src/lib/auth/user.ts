import { sClient, uClient } from '$lib/db/client';
import { fql, TimeStub, type Document } from 'fauna';
import type { WebAuthnUserCredential } from './server/webauthn';
import { encodeBase64 } from '@oslojs/encoding';
import { deleteAccessTokenCookie, deleteRefreshTokenCookie, invalidateSession } from './sign-in/session';
import type { RequestEvent } from '@sveltejs/kit';

export async function signUpWithSocialProvider(
	githubId: string,
	email: string,
	username: string
): Promise<Tokens> {
	const response = await sClient.query<Tokens>(
		fql`signUpWithSocialProvider({ email: ${email}, userId: ${githubId}, provider: "Github", firstName: ${username}, lastName: ${username} })`
	);

	return response.data;
}

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

export async function signInWithSocialProvider(
	provider: Provider,
	providerAccountId: string
): Promise<Tokens> {
	const response = await sClient.query<Tokens>(
		fql`signInWithSocialProvider(${provider}, ${providerAccountId})`
	);

	return response.data;
}

export async function signInWithPasskey(passkeyId: string): Promise<Tokens> {
	const response = await sClient.query<Tokens>(fql`signInWithPasskey(${passkeyId})`);

	return response.data;
}

/**
 *
 * @returns Returns the current user based on the access token
 */
export async function getUser(accessToken: string): Promise<User> {
	const response = await uClient(accessToken).query<User>(fql`Query.identity()`);
	return response.data;
}

export async function verifyUserExists(email: string): Promise<boolean> {
	const response = await sClient.query<boolean>(fql`verifyUserExists(${email})`);
	return response.data;
}

export async function verifySocialAccountExists(
	provider: Provider,
	providerAccountId: string
): Promise<boolean> {
	const response = await sClient.query<boolean>(
		fql`verifySocialAccountExists(${provider}, ${providerAccountId})`
	);
	return response.data;
}

export async function createRegistration(email: string): Promise<string> {
	const response = await sClient.query<string>(fql`createRegistration(${email})`);
	return response.data;
}

export async function signOut(event: RequestEvent): Promise<boolean> {
	const accessToken = event.cookies.get('access_token');
	if (accessToken) {
		try {
			await invalidateSession(accessToken);
			deleteAccessTokenCookie(event);
			deleteRefreshTokenCookie(event);
			return true; // Sign-out successful
		} catch (error) {
			console.error('Failed to sign out:', error);
			return false; // Sign-out failed
		}
	}
	return false; // No access token found, treat as failure
}


export type User = Document & {
	firstName: string;
	lastName: string;
	email: string;
	emailVerified: TimeStub;
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
