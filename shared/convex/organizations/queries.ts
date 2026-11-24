import { query } from '../_generated/server';
import { components } from '../_generated/api';

// better-auth
import { authComponent, createAuth } from '../auth';
import { v } from 'convex/values';

/* `listOrganizations` and `getActiveOrganization` answer an absence only when it is confirmed: no
   one is signed in on the request, its session or user no longer exists, the user has no active
   organization, or is no longer a member of it. A lookup that fails throws, so a client sees an
   error it can hold through instead of an empty answer it would take for "none". */

/**
 * Get all organizations for the current user: `[]` when there is none (see above), an error when
 * the list could not be read
 */
export const listOrganizations = query({
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) {
			return [];
		}

		const auth = createAuth(ctx);
		return await auth.api.listOrganizations({
			headers: await authComponent.getHeaders(ctx)
		});
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
				return activeMember?.role || null;
			}

			// Get role from specific organization
			const memberList = await auth.api.listMembers({
				query: { organizationId },
				headers
			});

			const member = memberList.members.find((member) => member.userId === user._id);
			return member?.role || null;
		} catch {
			return null;
		}
	}
});

/**
 * Gets the active organization for the current user: the user's `activeOrganizationId`; null when
 * there is none (see above), an error when it could not be read
 */
export const getActiveOrganization = query({
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) {
			return null;
		}

		const organizationId = user.activeOrganizationId;
		if (!organizationId) return null;
		// Read here: getFullOrganization reports a non-member as an error, like a failed lookup
		const member = await ctx.runQuery(components.betterAuth.adapter.findOne, {
			model: 'member',
			where: [
				{ field: 'organizationId', value: organizationId },
				{ field: 'userId', value: user._id }
			]
		});
		if (!member) return null;

		const auth = createAuth(ctx);
		return await auth.api.getFullOrganization({
			query: { organizationId },
			headers: await authComponent.getHeaders(ctx)
		});
	}
});
