import { query } from '../_generated/server';

// better-auth
import { authComponent, createAuth } from '../auth';
import { v } from 'convex/values';

/**
 * Get all organizations for the current user
 */
export const listOrganizations = query({
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) {
			return [];
		}

		try {
			const auth = createAuth(ctx);
			return await auth.api.listOrganizations({
				headers: await authComponent.getHeaders(ctx)
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
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) {
			return null;
		}

		const auth = createAuth(ctx);
		const headers = await authComponent.getHeaders(ctx);

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

			const member = memberList.members.find((member) => member.userId === user._id);
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
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) {
			return null;
		}

		try {
			const auth = createAuth(ctx);
			return await auth.api.getFullOrganization({
				headers: await authComponent.getHeaders(ctx)
			});
		} catch {
			return null;
		}
	}
});
