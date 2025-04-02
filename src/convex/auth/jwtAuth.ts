import * as jose from 'jose';
import { v } from 'convex/values';
import { mutation, query } from '../functions';
import { internal } from '../_generated/api';
import { Ent } from '../types';
import { getJwtSecret } from './environment';
import { Id } from '../_generated/dataModel';
import { action } from '../_generated/server';

// JWT authentication resolver
export const authenticateJWT = query({
	args: {
		jwt: v.string()
	},
	handler: async (ctx, args) => {
		try {
			// Verify the JWT
			const secret = await getJwtSecret();
			const { payload } = await jose.jwtVerify(args.jwt, secret, {
				algorithms: ['HS256']
			});

			// Extract user ID from payload
			const userId = payload.sub as Id<'users'>;

			// Get the user from the database
			const user = await ctx.table('users').getX(userId);

			if (!user) {
				return { success: false, message: 'User not found' };
			}

			// Return authentication result
			return {
				success: true,
				userId: user._id,
				user: {
					_id: user._id,
					firstName: user.firstName,
					lastName: user.lastName,
					primaryEmail: user.primaryEmail
				}
			};
		} catch (error) {
			console.error('JWT authentication error:', error);
			return { success: false, message: 'Invalid token' };
		}
	}
});

// Get the current user based on JWT
export const getCurrentUser = query({
	args: {
		accessToken: v.string()
	},
	handler: async (ctx, args) => {
		const tokenData = (await ctx.runQuery(internal.auth.tokens.validateToken, {
			token: args.accessToken,
			type: 'access'
		})) as Ent<'accessTokens'> | null;

		if (!tokenData) {
			return null;
		}

		// Get the user from the database
		const user = await ctx.table('users').getX(tokenData.userId);
		return user;
	}
});

/**
 * Generate tokens for a user after authenticating with OAuth
 * Used in the OAuth callback flow
 */
export const createTokensForUser = mutation({
	args: {
		userId: v.id('users')
	},
	handler: async (
		ctx,
		args
	): Promise<{
		access: { token: string; expiresAt: number };
		refresh: { token: string; expiresAt: number };
	}> => {
		// Create tokens for the authenticated user
		const tokens = await ctx.runMutation(internal.auth.tokens.createAccessAndRefreshToken, {
			userId: args.userId
		});

		return tokens;
	}
});

/**
 * Handle OAuth callback and exchange code for tokens
 */
export const handleOAuthCallback = action({
	args: {
		code: v.string(),
		provider: v.union(v.literal('github'), v.literal('google'))
	},
	handler: async (
		ctx,
		args
	): Promise<{
		success: boolean;
		tokens?: {
			access: { token: string; expiresAt: number };
			refresh: { token: string; expiresAt: number };
		};
		user?: Ent<'users'>;
		error?: string;
	}> => {
		try {
			let userData: { id: string; email: string; name: string } | null = null;

			// Different OAuth provider handling
			if (args.provider === 'github') {
				// Exchange code for GitHub token
				const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Accept: 'application/json'
					},
					body: JSON.stringify({
						client_id: process.env.GITHUB_CLIENT_ID || ctx.env?.GITHUB_CLIENT_ID,
						client_secret: process.env.GITHUB_CLIENT_SECRET || ctx.env?.GITHUB_CLIENT_SECRET,
						code: args.code
					})
				});

				const tokenData = await tokenResponse.json();

				// Get user info from GitHub
				const userResponse = await fetch('https://api.github.com/user', {
					headers: {
						Authorization: `token ${tokenData.access_token}`
					}
				});

				const githubUser = await userResponse.json();

				userData = {
					id: githubUser.id.toString(),
					email: githubUser.email,
					name: githubUser.name || githubUser.login
				};
			} else if (args.provider === 'google') {
				// TODO: Implement Google OAuth
				return { success: false, error: 'Google OAuth not yet implemented' };
			}

			if (!userData) {
				return { success: false, error: 'Failed to get user data from provider' };
			}

			// Find or create user
			let user = await ctx.runQuery(internal.auth.users.getUserByEmail, {
				email: userData.email
			});

			if (!user) {
				// Parse the name into first and last
				const nameParts = userData.name.split(' ');
				const firstName = nameParts[0];
				const lastName = nameParts.slice(1).join(' ');

				// Create new user
				user = await ctx.runMutation(internal.auth.users.createUser, {
					firstName,
					lastName: lastName || '',
					primaryEmail: userData.email,
					emails: [userData.email]
				});

				// Create social provider account
				await ctx.runMutation(internal.auth.accounts.createSocialAccount, {
					userId: user._id,
					provider: args.provider,
					providerId: userData.id,
					email: userData.email
				});
			}

			// Create JWT tokens
			const tokens = await ctx.runMutation(internal.auth.tokens.createAccessAndRefreshToken, {
				userId: user._id
			});

			return {
				success: true,
				user,
				tokens
			};
		} catch (error) {
			console.error('OAuth error:', error);
			return { success: false, error: 'Authentication failed' };
		}
	}
});
