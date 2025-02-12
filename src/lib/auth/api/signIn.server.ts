import client from '$lib/db/client';
import { FAUNA_SIGNIN_KEY } from '$env/static/private';
import { fql } from 'fauna';

import type { SocialProvider } from '$lib/account/api/types';
import type { Tokens } from './types';



export async function signInWithSocialProvider(
    providerName: SocialProvider,
    providerUserId: string
): Promise<Tokens> {
    const response = await client(FAUNA_SIGNIN_KEY).query<Tokens>(
        fql`signInWithSocialProvider(${providerName}, ${providerUserId})`
    );

    return response.data;
}

export async function signInWithPasskey(passkeyId: string): Promise<Tokens> {
    const response = await client(FAUNA_SIGNIN_KEY).query<Tokens>(fql`signInWithPasskey(${passkeyId})`);
    return response.data;
}