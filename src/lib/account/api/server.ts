import { encodeBase64 } from '@oslojs/encoding';
import { fql } from 'fauna';

import client from '$lib/db/client';
import { validatePasskeyData } from '$lib/auth/api/passkey.server.ts';

import type { Account } from '$lib/db/schema/types/custom';
import type { NullDocument } from '$lib/db/schema/types/system';
import type { WebAuthnUserCredentialEncoded } from '$lib/auth/api/types';
import type { SocialProvider } from './types';
import type { CreatePasskeyAccountData } from '$lib/user/api/types';

export async function createSocialProviderAccount(
	accessToken: string,
	accountData: { providerName: SocialProvider; providerUserId: string; providerUserEmail: string }
): Promise<Account> {
	const response = await client(accessToken).query<Account>(
		fql`createSocialProviderAccount(${accountData}, null)`
	);
	return response.data;
}

export async function createPasskeyAccount(
	accessToken: string,
	data: CreatePasskeyAccountData
	// credential: WebAuthnUserCredentialEncoded
): Promise<Account> {
	console.log(`Attempting to create passkey account for user: ${data.userId}`);

	const credential = await validatePasskeyData(data);

	const encodedCredential: WebAuthnUserCredentialEncoded = {
		id: encodeBase64(credential.id),
		userId: credential.userId,
		algorithmId: credential.algorithmId,
		publicKey: encodeBase64(credential.publicKey)
	};

	console.log(`Attempting to create passkey account with credential:`, encodedCredential);

	const response = await client(accessToken).query<Account>(
		fql`createPasskeyAccount(${encodedCredential}, null)`
	);

	return response.data;
}

export async function deleteAccount(accessToken: string, accountId: string): Promise<NullDocument> {
	console.log(`\n***\n1 Deleting account with access token: ${accessToken} and accountId: ${accountId} \n***\n`);
	const response = await client(accessToken).query<NullDocument>(fql`deleteAccount(${accountId})`);
	return response.data;
}
