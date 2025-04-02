import type { RequestEvent } from '@sveltejs/kit';
import {
	deleteAccessTokenCookie,
	deleteRefreshTokenCookie,
	invalidateAllSessions,
	invalidateSession
} from './session.server';

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
			await invalidateAllSessions(accessToken);
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
