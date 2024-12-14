import { sClient, uClient } from '$lib/db/client';
import { fql, TimeStub, type Document } from 'fauna';
import type { WebAuthnUserCredential } from './server/webauthn';

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
	// const query = fql`signUpWithPasskey(${credential}, { firstName: ${firstName}, lastName: ${lastName}, email: ${email} })`;
	const query = fql`signUpWithPasskey({[${credential.id}], ${credential.userId}, ${credential.algorithmId}, [${credential.publicKey}]}, { firstName: ${firstName}, lastName: ${lastName}, email: ${email} })`;
	// console.log('\nuser.ts \n', 'signUpWithPasskey query: ', query.encode());
	console.log(
		'\nuser.ts \n',
		'signUpWithPasskey query: ',
		`signUpWithPasskey({${credential.id}, ${credential.userId}, ${credential.algorithmId}, ${credential.publicKey}}, { firstName: ${firstName}, lastName: ${lastName}, email: ${email} })`
	);

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

export async function signInWithPasskey(providerAccountId: string): Promise<Tokens> {
	const response = await sClient.query<Tokens>(fql`signInWithPassKey(${providerAccountId})`);

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
