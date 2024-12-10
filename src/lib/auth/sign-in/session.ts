import type { Tokens, User } from './user';
import type { RequestEvent } from '@sveltejs/kit';
import { uClient } from '$lib/db/client';
import { fql } from 'fauna';

export async function invalidateSession(secret: string): Promise<void> {
	await uClient(secret).query(fql`signOut()`)
}

export async function invalidateUserSessions(secret: string): Promise<void> {
	await uClient(secret).query(fql`signOutFromAllDevices()`)
}

export function setAccessTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
	event.cookies.set('access_token', token, {
		httpOnly: true,
		sameSite: 'lax',
		expires: expiresAt,
		path: '/',
	});
}

export function setRefreshTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
	event.cookies.set('refresh_token', token, {
		httpOnly: true,
		sameSite: 'strict', // Consider 'strict' for added security
		expires: expiresAt,
		path: '/',
	});
}

export function deleteAccessTokenCookie(event: RequestEvent): void {
	event.cookies.delete('access_token', {
		path: '/', 
	});
}

export function deleteRefreshTokenCookie(event: RequestEvent): void {
	event.cookies.delete('refresh_token', {
		path: '/', 
	});
}

export async function refreshAccessToken(refreshToken: string): Promise<Tokens> {
	const response = await uClient(refreshToken).query(fql`refreshAccessToken()`)
	return response.data
}

export type SessionValidationResult =
	| { session: Session; user: User }
	| { session: null; user: null };

export interface Session {
	id: string;
	userId: number;
	expiresAt: Date;
}
