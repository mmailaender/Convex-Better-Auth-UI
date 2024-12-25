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

/**
 * Splits a full name into first name and last name.
 *
 * @param fullName - The full name string to be split.
 * @returns An object containing `firstName` and `lastName`.
 */
function splitFullName(fullName: string): { firstName: string; lastName: string } {
    // Trim the input to remove leading and trailing whitespace
    const trimmedName = fullName.trim();

    // Replace multiple spaces with a single space
    const normalizedName = trimmedName.replace(/\s+/g, ' ');

    // Split the name into parts based on space
    const nameParts = normalizedName.split(' ');

    // Initialize firstName and lastName
    let firstName = '';
    let lastName = '';

    if (nameParts.length === 0) {
        // Empty string case
        firstName = '';
        lastName = '';
    } else if (nameParts.length === 1) {
        // Only one name part, assign to firstName
        firstName = nameParts[0];
        lastName = '';
    } else {
        // More than one name part
        // Assign last part to lastName and the rest to firstName
        lastName = nameParts[nameParts.length - 1];
        firstName = nameParts.slice(0, -1).join(' ');
    }

    return { firstName, lastName };
}

export async function GET(event: RequestEvent): Promise<Response> {
	console.log('GitHub OAuth callback initiated');
	const storedState = event.cookies.get('github_oauth_state') ?? null;
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');

	if (storedState === null || code === null || state === null || storedState !== state) {
		console.warn('State validation failed or missing parameters');
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
		console.log('Validating authorization code with GitHub');
		tokens = await github.validateAuthorizationCode(code);
	} catch (error) {
		console.error('Error validating authorization code:', error);
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
	console.log('Fetching GitHub user information');
	const userRequest = new Request('https://api.github.com/user');
	userRequest.headers.set('Authorization', `Bearer ${githubAccessToken}`);
	const userResponse = await fetch(userRequest);
	const userResult: unknown = await userResponse.json();
	const userParser = new ObjectParser(userResult);

	const githubUserId = userParser.getNumber('id').toString();
	const username = userParser.getString('login');
	const fullName = userParser.getString('name');
	const { firstName, lastName } = splitFullName(fullName);
	console.log('GitHub user information fetched:', { githubUserId, username, firstName, lastName });

	// Check if the user already exists
	console.log('Checking if the GitHub user already exists');
	const userExists = await verifySocialAccountExists('Github', githubUserId);
	if (userExists) {
		console.log('User exists, signing in');
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
	console.log('Fetching verified email address from GitHub');
	const emailListRequest = new Request('https://api.github.com/user/emails');
	emailListRequest.headers.set('Authorization', `Bearer ${githubAccessToken}`);
	const emailListResponse = await fetch(emailListRequest);
	const emailListResult: unknown = await emailListResponse.json();
	if (!Array.isArray(emailListResult) || emailListResult.length < 1) {
		console.warn('No verified email addresses found');
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
		console.warn('No primary verified email address found');
		const errorMessage = encodeURIComponent('Please verify your GitHub email address.');
		return new Response(null, {
			status: 302,
			headers: {
				Location: `/sign-in?error=${errorMessage}`
			}
		});
	}

	try {
		console.log('Creating new user with GitHub account');
		const { access, refresh } = await signUpWithSocialProvider(githubUserId, email, firstName || username, lastName || '');
		setAccessTokenCookie(event, access.secret!, access.ttl!.toDate());
		setRefreshTokenCookie(event, refresh.secret!, refresh.ttl!.toDate());
	} catch (error) {
		console.error('Error during user sign-up:', error);
		const errorMessage = encodeURIComponent('User with this email already exists. Please sign in with your initial used account.');
		return new Response(null, {
			status: 302,
			headers: {
				Location: `/sign-in?error=${errorMessage}`
			}
		});
	}

	console.log('GitHub OAuth process completed successfully');
	return new Response(null, {
		status: 302,
		headers: {
			Location: '/'
		}
	});
}
