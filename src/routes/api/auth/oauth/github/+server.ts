/**
 * Handles the GitHub OAuth authorization request.
 * Generates a state token, creates an authorization URL, and sets a cookie with the state.
 * Redirects the user to the GitHub authorization page.
 *
 * @param {RequestEvent} event - The incoming request event.
 * @returns {Response} A redirect response to the GitHub authorization URL.
 */
import { github } from '$lib/auth/social/oauth';
import { generateState } from 'arctic';

import type { RequestEvent } from './$types';

export function GET(event: RequestEvent): Response {
	const state = generateState();
	const redirectUrl = event.url.searchParams.get('redirect_url') || '/';

	console.log('Redirect URL:', event.url.searchParams.get('redirect_url'));
	
	const url = github.createAuthorizationURL(state, ['user:email']);

	event.cookies.set('oauth_state', state, {
		httpOnly: true,
		maxAge: 60 * 10,
		secure: import.meta.env.PROD,
		path: '/',
		sameSite: 'lax'
	});
	event.cookies.set('oauth_redirect_url', redirectUrl, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax'
	});

	
	return new Response(null, {
		status: 302,
		headers: {
			Location: url.toString()
		}
	});
}
