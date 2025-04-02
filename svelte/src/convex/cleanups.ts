import { internalMutation } from './functions';

// Clean up verifications that have expired
export const cleanExpiredVerifications = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const expiredVerifications = await ctx.table('verifications', 'by_expiration', (q) =>
			q.lt('expiresAt', now)
		);

		for (const verification of expiredVerifications) {
			await verification.delete();
		}

		return { deleted: expiredVerifications.length };
	}
});

// Clean up invitations that have expired
export const cleanExpiredInvitations = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const expiredInvitations = await ctx.table('invitations', 'by_expiration', (q) =>
			q.lt('expiresAt', now)
		);

		for (const invitation of expiredInvitations) {
			await invitation.delete();
		}

		return { deleted: expiredInvitations.length };
	}
});

// Clean up access tokens that have expired
export const cleanExpiredAccessTokens = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const expiredTokens = await ctx.table('accessTokens', 'by_expiration', (q) =>
			q.lt('expiresAt', now)
		);

		for (const token of expiredTokens) {
			await token.delete();
		}

		return { deleted: expiredTokens.length };
	}
});

// Clean up refresh tokens that have expired
export const cleanExpiredRefreshTokens = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const expiredTokens = await ctx.table('refreshTokens', 'by_expiration', (q) =>
			q.lt('expiresAt', now)
		);

		for (const token of expiredTokens) {
			await token.delete();
		}

		return { deleted: expiredTokens.length };
	}
});
