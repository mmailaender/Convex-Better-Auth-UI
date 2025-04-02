import { type Cookies } from '@sveltejs/kit';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '$lib/../convex/_generated/api';

// Configure token names and options
const ACCESS_TOKEN_NAME = 'access_token';
const REFRESH_TOKEN_NAME = 'refresh_token';
const COOKIE_OPTIONS = {
	httpOnly: true,
	path: '/',
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'lax' as const
};

// Create a session manager
export class SessionManager {
	private client: ConvexHttpClient;

	constructor(convexUrl: string) {
		this.client = new ConvexHttpClient(convexUrl);
	}

	// Create session for a user
	async createSession(userId: string, cookies: Cookies) {
		// Create tokens for the user
		const tokensResult = await this.client.mutation(api.auth.tokens.createAccessAndRefreshToken, {
			userId
		});

		// Set cookies
		cookies.set(ACCESS_TOKEN_NAME, tokensResult.access.token, {
			...COOKIE_OPTIONS,
			maxAge: 10 * 60 // 10 minutes
		});

		cookies.set(REFRESH_TOKEN_NAME, tokensResult.refresh.token, {
			...COOKIE_OPTIONS,
			maxAge: 8 * 60 * 60 // 8 hours
		});

		return tokensResult;
	}

	// Get the current user from the session
	async getCurrentUser(cookies: Cookies) {
		const accessToken = cookies.get(ACCESS_TOKEN_NAME);

		if (!accessToken) {
			return null;
		}

		// Verify with Convex
		const user = await this.client.query(api.auth.jwtAuth.getCurrentUser, { accessToken });

		return user;
	}

	// Refresh tokens when access token expires
	async refreshTokens(cookies: Cookies) {
		const refreshToken = cookies.get(REFRESH_TOKEN_NAME);

		if (!refreshToken) {
			return null;
		}

		// Refresh tokens
		const newTokens = await this.client.mutation(
			api.auth.tokens.refreshAccessTokenWithRefreshToken,
			{ refreshToken }
		);

		if (!newTokens) {
			// Clear invalid cookies
			cookies.delete(ACCESS_TOKEN_NAME, COOKIE_OPTIONS);
			cookies.delete(REFRESH_TOKEN_NAME, COOKIE_OPTIONS);
			return null;
		}

		// Set new cookies
		cookies.set(ACCESS_TOKEN_NAME, newTokens.access.token, {
			...COOKIE_OPTIONS,
			maxAge: 10 * 60 // 10 minutes
		});

		cookies.set(REFRESH_TOKEN_NAME, newTokens.refresh.token, {
			...COOKIE_OPTIONS,
			maxAge: 8 * 60 * 60 // 8 hours
		});

		return newTokens;
	}

	// End the user's session
	async endSession(cookies: Cookies) {
		const accessToken = cookies.get(ACCESS_TOKEN_NAME);

		// Invalidate the token on the server
		if (accessToken) {
			await this.client.mutation(api.auth.tokens.deleteTokenByHash, {
				tokenHash: accessToken,
				type: 'access'
			});
		}

		// Clear cookies
		cookies.delete(ACCESS_TOKEN_NAME, COOKIE_OPTIONS);
		cookies.delete(REFRESH_TOKEN_NAME, COOKIE_OPTIONS);
	}
}
