/**
 * Handles the GitHub OAuth callback.
 * Validates the authorization code and state, retrieves user information from GitHub,
 * and either signs in the user or creates a new account.
 *
 * @param {RequestEvent} event - The incoming request event.
 * @returns {Promise<Response>} A redirect response to the appropriate location based on the outcome.
 */
import { github } from '$lib/auth/social/oauth';
import { ObjectParser } from '@pilcrowjs/object-parser';
import {
	signUpWithSocialProvider,
	signInWithSocialProvider,
	verifySocialAccountExists
} from '$lib/auth/user';
import { setAccessTokenCookie, setRefreshTokenCookie } from '$lib/auth/session';

import type { OAuth2Tokens } from 'arctic';
import type { RequestEvent } from './$types';

export async function GET(event: RequestEvent): Promise<Response> {
	const storedState = event.cookies.get('github_oauth_state') ?? null;
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');

	if (storedState === null || code === null || state === null || storedState !== state) {
		const errorMessage = encodeURIComponent('Please restart the process.');
		return new Response(null, {
			status: 302,
			headers: {
				Location: `/sign-in?error=${errorMessage}`
			}
		});
	}

	let tokens: OAuth2Tokens;
	try {
		tokens = await github.validateAuthorizationCode(code);
	} catch {
		const errorMessage = encodeURIComponent('Please restart the process.');
		return new Response(null, {
			status: 302,
			headers: {
				Location: `/sign-in?error=${errorMessage}`
			}
		});
	}

	const githubAccessToken = tokens.accessToken();

	// Fetch GitHub user information
	const userRequest = new Request('https://api.github.com/user');
	userRequest.headers.set('Authorization', `Bearer ${githubAccessToken}`);
	const userResponse = await fetch(userRequest);
	const userResult: unknown = await userResponse.json();
	const userParser = new ObjectParser(userResult);

	const githubUserId = userParser.getNumber('id').toString();
	const username = userParser.getString('login');

	// Check if the user already exists
	const userExists = await verifySocialAccountExists('Github', githubUserId);
	if (userExists) {
		const { access, refresh } = await signInWithSocialProvider('Github', githubUserId);

		setAccessTokenCookie(event, access.secret!, access.ttl!.toDate());
		setRefreshTokenCookie(event, refresh.secret!, refresh.ttl!.toDate());

		return new Response(null, {
			status: 302,
			headers: {
				Location: '/'
			}
		});
	}

	// Fetch verified email address from GitHub
	const emailListRequest = new Request('https://api.github.com/user/emails');
	emailListRequest.headers.set('Authorization', `Bearer ${githubAccessToken}`);
	const emailListResponse = await fetch(emailListRequest);
	const emailListResult: unknown = await emailListResponse.json();
	if (!Array.isArray(emailListResult) || emailListResult.length < 1) {
		const errorMessage = encodeURIComponent('Please restart the process.');
		return new Response(null, {
			status: 302,
			headers: {
				Location: `/sign-in?error=${errorMessage}`
			}
		});
	}

	let email: string | null = null;
	for (const emailRecord of emailListResult) {
		const emailParser = new ObjectParser(emailRecord);
		if (emailParser.getBoolean('primary') && emailParser.getBoolean('verified')) {
			email = emailParser.getString('email');
			break;
		}
	}

	if (email === null) {
		const errorMessage = encodeURIComponent('Please verify your GitHub email address.');
		return new Response(null, {
			status: 302,
			headers: {
				Location: `/sign-in?error=${errorMessage}`
			}
		});
	}

	try {
		const { access, refresh } = await signUpWithSocialProvider(githubUserId, email, username);
		setAccessTokenCookie(event, access.secret!, access.ttl!.toDate());
		setRefreshTokenCookie(event, refresh.secret!, refresh.ttl!.toDate());
	} catch {
		const errorMessage = encodeURIComponent('User with this email already exists. Please sign in with your initial used account.');
		return new Response(null, {
			status: 302,
			headers: {
				Location: `/sign-in?error=${errorMessage}`
			}
		});
	}

	return new Response(null, {
		status: 302,
		headers: {
			Location: '/'
		}
	});
}
