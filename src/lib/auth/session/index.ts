import type { Tokens } from '../user';
import type { RequestEvent } from '@sveltejs/kit';
import uClient from '$lib/db/userClient';
import { fql } from 'fauna';
import type { User } from '$lib/db/schema/types/custom';

/**
 * Invalidates the current session for the user.
 * Ensures the user is signed out from the current device.
 *
 * @param {string} secret - The session secret token.
 * @returns {Promise<void>} Resolves when the session is invalidated.
 */
export async function invalidateSession(secret: string): Promise<void> {
	await uClient(secret).query(fql`signOut()`);
}

/**
 * Invalidates all sessions for the user across all devices.
 * Useful for enforcing a complete logout from all logged-in locations.
 *
 * @param {string} secret - The session secret token.
 * @returns {Promise<void>} Resolves when all sessions are invalidated.
 */
export async function invalidateUserSessions(secret: string): Promise<void> {
	await uClient(secret).query(fql`signOutFromAllDevices()`);
}

/**
 * Sets an access token as an HTTP-only cookie.
 *
 * @param {RequestEvent} event - The incoming request event.
 * @param {string} token - The access token to set.
 * @param {Date} expiresAt - The expiration date of the cookie.
 */
export function setAccessTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
	event.cookies.set('access_token', token, {
		httpOnly: true,
		sameSite: 'lax',
		expires: expiresAt,
		path: '/',
	});
}

/**
 * Sets a refresh token as an HTTP-only cookie.
 *
 * @param {RequestEvent} event - The incoming request event.
 * @param {string} token - The refresh token to set.
 * @param {Date} expiresAt - The expiration date of the cookie.
 */
export function setRefreshTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
	event.cookies.set('refresh_token', token, {
		httpOnly: true,
		sameSite: 'strict',
		expires: expiresAt,
		path: '/',
	});
}

/**
 * Deletes the access token cookie.
 *
 * @param {RequestEvent} event - The incoming request event.
 */
export function deleteAccessTokenCookie(event: RequestEvent): void {
	event.cookies.delete('access_token', {
		path: '/',
	});
}

/**
 * Deletes the refresh token cookie.
 *
 * @param {RequestEvent} event - The incoming request event.
 */
export function deleteRefreshTokenCookie(event: RequestEvent): void {
	event.cookies.delete('refresh_token', {
		path: '/',
	});

	// console.log("After deletion:", event.cookies.getAll());
}

/**
 * Refreshes the access token using the provided refresh token.
 *
 * @param {string} refreshToken - The refresh token to exchange for a new access token.
 * @returns {Promise<Tokens>} The new set of tokens.
 */
export async function refreshAccessToken(refreshToken: string): Promise<Tokens> {
	const response = await uClient(refreshToken).query(fql`refreshAccessToken()`);
	return response.data;
}

export type SessionValidationResult =
	| { session: Session; user: User }
	| { session: null; user: null };

export interface Session {
	id: string;
	userId: number;
	expiresAt: Date;
}
