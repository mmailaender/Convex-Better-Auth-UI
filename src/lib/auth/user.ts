import uClient from '$lib/db/userClient';
import { fql } from 'fauna';
import {
	deleteAccessTokenCookie,
	deleteRefreshTokenCookie,
	invalidateSession,
	invalidateUserSessions
} from './session';
import type { RequestEvent } from '@sveltejs/kit';
import type { User, User_FaunaUpdate } from '$lib/db/schema/types/custom';
import type { Document, Document_Update } from '$lib/db/schema/types/system';

/**
 * Retrieves the current user based on the provided access token.
 *
 * @param {string} accessToken - The user's access token.
 * @returns {Promise<Document<User>>} The user object.
 */
export async function getUser(accessToken: string): Promise<Document<User>> {
	const response = await uClient(accessToken).query<Document<User>>(fql`Query.identity()`);
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

export async function updateUser(
	accessToken: string,
	user: Document_Update<User_FaunaUpdate>
): Promise<Document<User>> {
	const response = await uClient(accessToken).query<Document<User>>(
		fql`Query.identity()!.update({${user}})`
	);
	return response.data;
}

export async function addEmail(
	accessToken: string,
	email: string,
	verificationOTP: string
): Promise<Document<User>> {
	try {
		const response = await uClient(accessToken).query<Document<User>>(
			fql`addEmail(${email}, ${verificationOTP})`
		); 
		return response.data;
	} catch (err: unknown) {
		if (err instanceof Error) {
			throw new Error(err.message);
		}
		throw new Error('Error updating email.');
	}
}


export async function deleteEmail(accessToken: string, email: string): Promise<Document<User>> {
	try {
		const response = await uClient(accessToken).query<Document<User>>(
			fql`deleteEmail(${email})`
		);
		return response.data;
	} catch (err: unknown) {
		if (err instanceof Error) {
			throw new Error(err.message);
		}
		throw new Error('Error updating email.');
	}
}

export async function setPrimaryEmail(accessToken: string, email: string): Promise<Document<User>> {
	try {
		const response = await uClient(accessToken).query<Document<User>>(
			fql`Query.identity()!.update({ primaryEmail: ${email} })`
		);
		return response.data;
	} catch (err: unknown) {
		if (err instanceof Error) {
			throw new Error(err.message);
		}
		throw new Error('Error updating email.');
	}
}

export async function cancelEmailVerification(
	accessToken: string,
	email: string
): Promise<boolean> {
	const response = await uClient(accessToken).query<boolean>(
        fql`deleteEmailVerification(${email})`
    );
    if (!response.data) {
        throw new Error(response.summary);
    }
	return response.data
}

export async function getUserAndAccounts(accessToken: string): Promise<Document<User>> {
	const response = await uClient(accessToken).query<Document<User>>(
		fql`Query.identity() {
			id,
			coll,
			firstName,
			lastName,
			primaryEmail,
			emailVerification,
			emails,
			accounts
		  }`
	);
	return response.data;
}

export type SocialProvider = 'Github' | 'Google' | 'Facebook';

export type Tokens = {
	access: Document<AccessToken>;
	refresh: Document<RefreshToken>;
};

export type AccessToken = {
	document: User;
	secret: string | null;
	data: {
		type: 'access';
		refresh: RefreshToken;
	};
};

export type RefreshToken = {
	document: User;
	secret: string | null;
	data: {
		type: 'refresh';
	};
};
