import { internalQuery, query } from '../_generated/server';

// better-auth
import { createAuth } from '../../src/components/auth/lib/auth';
import { betterAuthComponent } from '../auth';
import { v } from 'convex/values';

/**
 * Get all organizations for the current user
 */
export const listOrganizations = query({
	handler: async (ctx) => {
		const userId = await betterAuthComponent.getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		try {
			const auth = createAuth(ctx);
			return await auth.api.listOrganizations({
				headers: await betterAuthComponent.getHeaders(ctx)
			});
		} catch {
			return [];
		}
	}
});

/**
 * Gets the current user's role in the specified organization
 * If organizationId is not provided, it will use the user's active organization
 * @returns The user's role in the organization or null if not a member or if no active organization exists when organizationId is not provided
 */
export const getOrganizationRole = query({
	args: {
		organizationId: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const { organizationId } = args;
		const userId = await betterAuthComponent.getAuthUserId(ctx);
		if (!userId) {
			return null;
		}

		const auth = createAuth(ctx);
		const headers = await betterAuthComponent.getHeaders(ctx);

		try {
			// Get role from active organization if no specific organizationId provided
			if (!args.organizationId) {
				const activeMember = await auth.api.getActiveMember({ headers });
				return (activeMember?.role as typeof auth.$Infer.Member.role) || null;
			}

			// Get role from specific organization
			const memberList = await auth.api.listMembers({
				query: { organizationId },
				headers
			});

			const member = memberList.members.find((member) => member.userId === userId);
			return (member?.role as typeof auth.$Infer.Member.role) || null;
		} catch {
			return null;
		}
	}
});

/**
 * Gets the active organization for the current user
 */
export const getActiveOrganization = query({
	handler: async (ctx) => {
		const userId = await betterAuthComponent.getAuthUserId(ctx);
		if (!userId) {
			return null;
		}

		try {
			const auth = createAuth(ctx);
			return await auth.api.getFullOrganization({
				headers: await betterAuthComponent.getHeaders(ctx)
			});
		} catch {
			return null;
		}
	}
});

export const _getActiveOrganizationFromDb = internalQuery({
	args: { userId: v.id('users') },
	handler: async (ctx, args) => {
		const user = await ctx.db.get(args.userId);
		if (!user || !user.activeOrganizationId) return null;
		return user.activeOrganizationId;
	}
});
