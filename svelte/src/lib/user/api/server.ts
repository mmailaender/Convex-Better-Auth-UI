import client from '$lib/db/client';
import type { Account, User } from '$lib/db/schema/types/custom';
import type { RequestEvent } from '@sveltejs/kit';
import { fql } from 'fauna';
import type { ProfileData } from './types';
import { deleteAccessTokenCookie, deleteRefreshTokenCookie } from '$lib/auth/api/session.server';
import { deleteBlob } from '$lib/primitives/api/storage/upload';
import { ArkErrors, type } from 'arktype';

/**
 * Retrieves the current user based on the provided access token.
 *
 * @param {string} accessToken - The user's access token.
 * @returns {Promise<User>} The user object.
 */
export async function getUser(accessToken: string): Promise<User> {
	const response = await client(accessToken).query<User>(fql`Query.identity()`);
	return response.data;
}

/**
 * Updates the current user based on the provided access token and user data.
 *
 * @param {string} accessToken - The user's access token.
 * @param {Partial<ProfileData>} profileData - The new user data.
 * @returns {Promise<User>} The updated user object.
 */
export async function updateProfileData(
	accessToken: string,
	profileData: Partial<ProfileData>
): Promise<User> {
	const response = await client(accessToken).query<User>(
		fql`Query.identity()!.update({${profileData}})`
	);
	return response.data;
}

/**
 * Retrieves the current user and their accounts based on the provided access token.
 *
 * @param {string} accessToken - The user's access token.
 * @returns {Promise<User>} The user object with their accounts.
 */
export async function getUserAccounts(accessToken: string): Promise<Array<Account>> {
	const response = await client(accessToken).query<Array<Account>>(fql`Query.identity()!.accounts`);
	return response.data;
}

/**
 * Deletes the user and removes their session cookies.
 *
 * @param {RequestEvent} event - The incoming request event.
 * @param {string} userId - The user ID to delete.
 * @returns {Promise<boolean>} True if the deletion was successful, false otherwise.
 */
export async function deleteUser(event: RequestEvent): Promise<boolean> {
	const accessToken = event.cookies.get('access_token');
	const user = event.locals.user;
	if (accessToken && user) {
		try {
			await client(accessToken).query<boolean>(fql`deleteUser(${user.id})`);

			const avatar = type('string.url')(user.avatar);
			if (typeof avatar === 'string') {
				await deleteBlob(avatar);
			}

			deleteAccessTokenCookie(event);
			deleteRefreshTokenCookie(event);
			console.log(`User ${user.id} deleted successfully`);
			return true;
		} catch (error) {
			console.error('Failed to delete user:', error);
			return false;
		}
	}
	return false;
}
