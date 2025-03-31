import { v } from 'convex/values';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { sha256 } from '@oslojs/crypto/sha2';
import * as jose from 'jose';

import { internalMutation, internalQuery, mutation } from '../functions';
import { internal } from '../_generated/api';

// Types
import { Id } from '../_generated/dataModel';
import { Ent } from '../types';

/**
 * Generates a cryptographically secure random string for use as a token.
 *
 * @param length Length of the resulting string
 * @returns Random string of specified length
 */
export function generateToken(): string {
	const tokenBytes = new Uint8Array(20);
	crypto.getRandomValues(tokenBytes);
	const token = encodeBase32LowerCaseNoPadding(tokenBytes);
	return token;
}

/**
 * Hashes a token for secure storage in the database.
 * We never store the raw token, only its hash.
 *
 * @param token The token to hash
 * @returns SHA-256 hash of the token
 */
export function hashToken(token: string): string {
	return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	// return createHash('sha256').update(token).digest('hex');
}

/**
 * Creates a JWT token for the user.
 *
 * @param userId The user ID to include in the JWT
 * @param expiresInSeconds Token expiration time in seconds
 * @returns Signed JWT string
 */
export async function createJWT(
	payload: Record<string, any>,
	expiresInSeconds: number
): Promise<string> {
	const secret = new TextEncoder().encode('JWT_SECRET'); // In production, fetch from env

	return new jose.SignJWT(payload)
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime(`${expiresInSeconds}s`)
		.setNotBefore(0)
		.sign(secret);
}

/**
 * Verifies a JWT and returns the payload if valid, null otherwise.
 *
 * @param jwt The JWT to verify
 * @returns The payload if valid, null otherwise
 */
export async function verifyJWT(jwt: string): Promise<Record<string, any> | null> {
	try {
		const secret = new TextEncoder().encode('JWT_SECRET'); // In production, fetch from env

		const { payload } = await jose.jwtVerify(jwt, secret, {
			algorithms: ['HS256']
		});

		return payload as Record<string, any>;
	} catch (error) {
		console.error('JWT verification error:', error);
		return null;
	}
}

/**
 * Generates a new access token as a JWT and stores its hash in the database.
 *
 * Returns the JWT string for use in cookies or headers.
 */
export const createAccessToken = internalMutation({
	args: {
		userId: v.id('users'),
		refreshTokenId: v.id('refreshTokens')
	},
	handler: async (
		ctx,
		args
	): Promise<{ token: string; id: Id<'accessTokens'>; expiresAt: number }> => {
		// 10 minute expiration for access tokens
		const expiresInSeconds = 10 * 60;
		const expiresAt = Date.now() + expiresInSeconds * 1000;

		// Create JWT with necessary claims
		const token = await createJWT(
			{
				sub: args.userId,
				refreshTokenId: args.refreshTokenId,
				type: 'access'
			},
			expiresInSeconds
		);

		// Hash the JWT for storage
		const tokenHash = hashToken(token);

		// Store the token hash, not the token itself
		const tokenId = await ctx.table('accessTokens').insert({
			userId: args.userId,
			refreshTokenId: args.refreshTokenId,
			tokenHash,
			expiresAt
		});

		return {
			token,
			id: tokenId,
			expiresAt
		};
	}
});

/**
 * Generates a new refresh token and stores it in the database.
 *
 * Returns the token string for use in cookies or headers.
 */
export const createRefreshToken = internalMutation({
	args: {
		userId: v.id('users')
	},
	handler: async (
		ctx,
		args
	): Promise<{ token: string; id: Id<'refreshTokens'>; expiresAt: number }> => {
		// 8 hour expiration for refresh tokens
		const expiresInSeconds = 8 * 60 * 60;
		const expiresAt = Date.now() + expiresInSeconds * 1000;

		// For refresh tokens, we still use random tokens rather than JWTs
		// This is a common pattern as refresh tokens don't need to be self-contained
		const token = generateToken();
		const tokenHash = hashToken(token);

		// Store the token hash, not the token itself
		const tokenId = await ctx.table('refreshTokens').insert({
			userId: args.userId,
			tokenHash,
			expiresAt
		});

		return {
			token,
			id: tokenId,
			expiresAt
		};
	}
});

/**
 * Creates both access and refresh tokens for a user.
 *
 * This is used during sign-in and sign-up processes.
 */
export const createAccessAndRefreshToken = internalMutation({
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
		// Create refresh token first
		const refreshTokenResult = await ctx.runMutation(internal.auth.tokens.createRefreshToken, {
			userId: args.userId
		});

		// Use the refresh token ID to create the access token
		const accessTokenResult = await ctx.runMutation(internal.auth.tokens.createAccessToken, {
			userId: args.userId,
			refreshTokenId: refreshTokenResult.id
		});

		return {
			access: {
				token: accessTokenResult.token,
				expiresAt: accessTokenResult.expiresAt
			},
			refresh: {
				token: refreshTokenResult.token,
				expiresAt: refreshTokenResult.expiresAt
			}
		};
	}
});

/**
 * Validates a token and returns the associated data.
 *
 * Works for both access and refresh tokens.
 */
export const validateToken = internalQuery({
	args: {
		token: v.string(),
		type: v.union(v.literal('access'), v.literal('refresh'))
	},
	handler: async (ctx, args) => {
		if (args.type === 'access') {
			// For access tokens, first verify the JWT
			const payload = verifyJWT(args.token);
			if (!payload) {
				return null;
			}

			// Then verify it exists in the database (for revocation support)
			const tokenHash = hashToken(args.token);
			const accessToken = await ctx
				.table('accessTokens', 'by_token_hash', (q) => q.eq('tokenHash', tokenHash))
				.first();

			if (!accessToken || Date.now() >= accessToken.expiresAt) {
				return null;
			}

			return {
				...accessToken,
				payload
			};
		} else {
			// For refresh tokens, check against the database
			const tokenHash = hashToken(args.token);
			const refreshToken = await ctx
				.table('refreshTokens', 'by_token_hash', (q) => q.eq('tokenHash', tokenHash))
				.first();

			if (!refreshToken || Date.now() >= refreshToken.expiresAt) {
				return null;
			}

			return refreshToken;
		}
	}
});

/**
 * Checks if the current context has a valid access token.
 *
 * This can be used as a utility to ensure that the user is authenticated
 * with an access token before performing actions.
 */
export const isCalledWithAccessToken = internalQuery({
	args: {
		accessToken: v.string()
	},
	handler: async (ctx, args): Promise<boolean> => {
		const tokenData = await ctx.runQuery(internal.auth.tokens.validateToken, {
			token: args.accessToken,
			type: 'access'
		});

		if (tokenData && 'expired' in tokenData && tokenData.expired) {
			return false;
		}

		return tokenData !== null;
	}
});

/**
 * Checks if the current context has a valid refresh token.
 */
export const isCalledWithRefreshToken = internalQuery({
	args: {
		refreshToken: v.string()
	},
	handler: async (ctx, args): Promise<boolean> => {
		const tokenData = await ctx.runQuery(internal.auth.tokens.validateToken, {
			token: args.refreshToken,
			type: 'refresh'
		});

		if (tokenData && 'expired' in tokenData && tokenData.expired) {
			return false;
		}

		return tokenData !== null;
	}
});

/**
 * Uses a refresh token to generate a new access token.
 *
 * This is used when the access token expires and needs to be refreshed.
 */
export const refreshAccessTokenWithRefreshToken = mutation({
	args: {
		refreshToken: v.string()
	},
	handler: async (
		ctx,
		args
	): Promise<{
		access: { token: string; expiresAt: number };
		refresh: { token: string; expiresAt: number };
	} | null> => {
		// Verify the refresh token
		const refreshTokenData = (await ctx.runQuery(internal.auth.tokens.validateToken, {
			token: args.refreshToken,
			type: 'refresh'
		})) as Ent<'refreshTokens'> | null;

		if (!refreshTokenData) {
			return null;
		}

		// Delete the old refresh token to prevent reuse
		const tokenDoc = await ctx.table('refreshTokens').getX(refreshTokenData._id);
		await tokenDoc.delete();

		// Create new tokens
		const newTokens = await ctx.runMutation(internal.auth.tokens.createAccessAndRefreshToken, {
			userId: refreshTokenData.userId
		});

		return newTokens;
	}
});

/**
 * Deletes a token from the database to invalidate it.
 */
export const deleteToken = internalMutation({
	args: {
		tokenId: v.union(v.id('accessTokens'), v.id('refreshTokens')),
		type: v.union(v.literal('access'), v.literal('refresh'))
	},
	handler: async (ctx, args) => {
		const tokenDoc = await ctx
			.table(args.type === 'access' ? 'accessTokens' : 'refreshTokens')
			.getX(args.tokenId);
		await tokenDoc.delete();
	}
});

/**
 * Deletes a token from the database by its hash.
 */
export const deleteTokenByHash = internalMutation({
	args: {
		tokenHash: v.string(),
		type: v.union(v.literal('access'), v.literal('refresh'))
	},
	handler: async (ctx, args) => {
		const token =
			args.type === 'access'
				? await ctx
						.table('accessTokens', 'by_token_hash', (q) => q.eq('tokenHash', args.tokenHash))
						.first()
				: await ctx
						.table('refreshTokens', 'by_token_hash', (q) => q.eq('tokenHash', args.tokenHash))
						.first();

		if (token) {
			const tokenDoc = await ctx
				.table(args.type === 'access' ? 'accessTokens' : 'refreshTokens')
				.getX(token._id);
			await tokenDoc.delete();
		}
	}
});

/**
 * Deletes all tokens for a user to force sign out on all devices.
 */
export const deleteAllUserTokens = internalMutation({
	args: {
		userId: v.id('users')
	},
	handler: async (ctx, args) => {
		const accessTokens = await ctx.table('accessTokens', 'userId', (q) =>
			q.eq('userId', args.userId)
		);
		for (const token of accessTokens) {
			const tokenDoc = await ctx.table('accessTokens').getX(token._id);
			await tokenDoc.delete();
		}

		const refreshTokens = await ctx.table('refreshTokens', 'userId', (q) =>
			q.eq('userId', args.userId)
		);
		for (const token of refreshTokens) {
			const tokenDoc = await ctx.table('refreshTokens').getX(token._id);
			await tokenDoc.delete();
		}
	}
});
