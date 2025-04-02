import { fql } from 'fauna';
import client from '$lib/db/client';
import { FAUNA_SIGNIN_KEY } from '$env/static/private';
import type { SocialProvider } from '$lib/account/api/types';
import type { Tokens, WebAuthnUserCredentialEncoded } from './types';

export async function signUpWithSocialProvider(
	userData: { firstName: string; lastName: string; email: string; avatar?: string },
	accountData: { providerName: SocialProvider; providerUserId: string; providerUserEmail: string }
): Promise<Tokens> {
	const response = await client(FAUNA_SIGNIN_KEY).query<Tokens>(
		fql`signUpWithSocialProvider( ${userData}, ${accountData} )`
	);

	return response.data;
}

export async function signUpWithPasskey(
	credential: WebAuthnUserCredentialEncoded,
	userData: { firstName: string; lastName: string; email: string }
): Promise<Tokens> {
	const query = fql`signUpWithPasskey(${credential}, ${userData})`;

	const response = await client(FAUNA_SIGNIN_KEY).query<Tokens>(query);
	return response.data;
}
