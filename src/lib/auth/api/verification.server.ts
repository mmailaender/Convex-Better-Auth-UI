import client from '$lib/db/client';
import { FAUNA_SIGNIN_KEY } from '$env/static/private';
import { fql } from 'fauna';

import type { SocialProvider } from "$lib/account/api/types";

/**
 * Verifies if a user exists with the given email address.
 *
 * @param {string} email - The user's email address.
 * @returns {Promise<boolean>} True if the user exists, false otherwise.
 */
export async function verifyUserExists(email: string): Promise<boolean> {
	const response = await client(FAUNA_SIGNIN_KEY).query<boolean>(fql`verifyUserExists(${email})`);
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
	const response = await client(FAUNA_SIGNIN_KEY).query<boolean>(
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
	const res = await client(FAUNA_SIGNIN_KEY).query<string>(
		fql`createVerification({email: ${email}, userId: ${userId ? userId : null}})`
	);
	return res.data;
}