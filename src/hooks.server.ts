import { TokenBucket } from "$lib/auth/rate-limit";
import { validateSessionToken, setSessionTokenCookie, deleteSessionTokenCookie } from "$lib/auth/sign-in/session";
import { sequence } from "@sveltejs/kit/hooks";

import type { Handle } from '@sveltejs/kit';
import { i18n } from '$lib/i18n';


const handleParaglide: Handle = i18n.handle();

const bucket = new TokenBucket<string>(100, 1);

const rateLimitHandle: Handle = async ({ event, resolve }) => {
    // Note: Assumes X-Forwarded-For will always be defined.
	const clientIP = event.request.headers.get("X-Forwarded-For");
	if (clientIP === null) {
        return resolve(event);
	}
	let cost: number;
	if (event.request.method === "GET" || event.request.method === "OPTIONS") {
        cost = 1;
	} else {
        cost = 3;
	}
	if (!bucket.consume(clientIP, cost)) {
        return new Response("Too many requests", {
            status: 429
		});
	}
	return resolve(event);
};

const authHandle: Handle = async ({ event, resolve }) => {
    const token = event.cookies.get("session") ?? null;
	if (token === null) {
        event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}
    
	const { session, user } = await validateSessionToken(token);
	if (session !== null) {
        setSessionTokenCookie(event, token, session.expiresAt);
	} else {
        deleteSessionTokenCookie(event);
	}
    
	event.locals.session = session;
	event.locals.user = user;
	return resolve(event);
};

export const handle: Handle = sequence(rateLimitHandle, authHandle, handleParaglide);
