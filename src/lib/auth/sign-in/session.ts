import { db } from './db';
import { base32, encodeHex } from 'oslo/encoding';
import { sha256 } from 'oslo/crypto';

import type { User } from './user';
import type { RequestEvent } from '@sveltejs/kit';

/** TODO: This is something that we can probably replace completely by fauna  */
export function generateSessionToken(): string {
	const tokenBytes = new Uint8Array(20);
	crypto.getRandomValues(tokenBytes);
	const token = base32.encode(tokenBytes, { includePadding: false }).toLowerCase();
	return token;
}

export async function createSession(token: string, userId: number): Promise<Session> {
	const tokenBuffer = await sha256(new TextEncoder().encode(token));
	const sessionId = encodeHex(tokenBuffer);
	const session: Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
	};
	db.execute('INSERT INTO session (id, user_id, expires_at) VALUES (?, ?, ?)', [
		session.id,
		session.userId,
		Math.floor(session.expiresAt.getTime() / 1000)
	]);
	return session;
}

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
	const tokenBuffer = await sha256(new TextEncoder().encode(token));
	const sessionId = encodeHex(tokenBuffer);
	const row = db.queryOne(
		`
SELECT session.id, session.user_id, session.expires_at, user.id, user.github_id, user.email, user.username FROM session
INNER JOIN user ON session.user_id = user.id
WHERE session.id = ?
`,
		[sessionId]
	);

	if (row === null) {
		return { session: null, user: null };
	}
	const session: Session = {
		id: row.string(0),
		userId: row.number(1),
		expiresAt: new Date(row.number(2) * 1000)
	};
	const user: User = {
		id: row.number(3),
		githubId: row.number(4),
		email: row.string(5),
		username: row.string(6)
	};
	if (Date.now() >= session.expiresAt.getTime()) {
		db.execute('DELETE FROM session WHERE id = ?', [session.id]);
		return { session: null, user: null };
	}
	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
		db.execute('UPDATE session SET expires_at = ? WHERE session.id = ?', [
			Math.floor(session.expiresAt.getTime() / 1000),
			session.id
		]);
	}
	return { session, user };
}

export function invalidateSession(sessionId: string): void {
	db.execute('DELETE FROM session WHERE id = ?', [sessionId]);
}

export function invalidateUserSessions(userId: number): void {
	db.execute('DELETE FROM session WHERE user_id = ?', [userId]);
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
	event.cookies.set('session', token, {
		httpOnly: true,
		sameSite: 'lax',
		expires: expiresAt,
		path: '/'
	});
}

export function deleteSessionTokenCookie(event: RequestEvent): void {
	event.cookies.set('session', '', {
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 0,
		path: '/'
	});
}

export type SessionValidationResult =
	| { session: Session; user: User }
	| { session: null; user: null };

export interface Session {
	id: string;
	userId: number;
	expiresAt: Date;
}
