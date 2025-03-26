import type { RequestEvent } from '@sveltejs/kit';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '$lib/../convex/_generated/api';
import { CONVEX_URL } from '$env/static/private';

// Create a client for making direct API calls to Convex
const client = new ConvexHttpClient(CONVEX_URL);

/**
 * Invalidates the current session for the user.
 * Ensures the user is signed out from the current device.
 *
 * @param {string} accessToken - The access token from the cookie.
 * @returns {Promise<void>} Resolves when the session is invalidated.
 */
export async function invalidateSession(accessToken: string): Promise<void> {
	await client.mutation(api.auth.signOut.signOut, { accessToken });
}

/**
 * Invalidates all sessions for the user across all devices.
 * Useful for enforcing a complete logout from all logged-in locations.
 *
 * @param {string} accessToken - The access token from the cookie.
 * @returns {Promise<void>} Resolves when all sessions are invalidated.
 */
export async function invalidateAllSessions(accessToken: string): Promise<void> {
	await client.mutation(api.auth.signOut.signOutFromAllDevices, { accessToken });
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
		path: '/'
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
		path: '/'
	});
}

/**
 * Deletes the access token cookie.
 *
 * @param {RequestEvent} event - The incoming request event.
 */
export function deleteAccessTokenCookie(event: RequestEvent): void {
	event.cookies.delete('access_token', {
		path: '/'
	});
}

/**
 * Deletes the refresh token cookie.
 *
 * @param {RequestEvent} event - The incoming request event.
 */
export function deleteRefreshTokenCookie(event: RequestEvent): void {
	event.cookies.delete('refresh_token', {
		path: '/'
	});
}

/**
 * Refreshes the access token using the provided refresh token.
 *
 * @param {string} refreshToken - The refresh token to exchange for a new access token.
 * @returns {Promise<Tokens>} The new set of tokens.
 */
export async function refreshAccessToken(refreshToken: string): Promise<Tokens> {
	const response = await client.mutation(api.auth.refreshToken.refreshAccessToken, {
		refreshToken
	});
	return response;
}

export type SessionValidationResult =
	| { session: Session; user: User }
	| { session: null; user: null };

export interface Session {
	id: string;
	userId: string;
	expiresAt: Date;
	twoFactorVerified: boolean;
}

export interface User {
	id: string;
	firstName: string;
	lastName: string;
	primaryEmail: string;
	emails: string[];
	emailVerified?: boolean;
	avatar?: string;
	roles: string[];
	registered2FA: boolean;
	registeredTOTP?: boolean;
	registeredPasskey?: boolean;
	registeredSecurityKey?: boolean;
}

export interface Tokens {
	access: {
		token: string;
		expiresAt: number;
	};
	refresh: {
		token: string;
		expiresAt: number;
	};
}
