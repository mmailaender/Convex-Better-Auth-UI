import { getAuthUserId } from '@convex-dev/auth/server';
import { query } from '../../_generated/server';
import { v } from 'convex/values';

import {
	getOrganizationMembersModel,
	isOwnerOrAdminModel
} from '../../model/organizations/members';

/**
 * Get all members of the current active organization (thin wrapper)
 */
export const getOrganizationMembers = query({
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		const user = await ctx.db.get(userId);
		if (!user || !user.activeOrganizationId) return [];

		const organizationId = user.activeOrganizationId;

		return getOrganizationMembersModel(ctx, { organizationId });
	}
});

/**
 * Check if the current user is an admin or owner of the specified organization
 */
export const isOwnerOrAdmin = query({
	args: {
		organizationId: v.id('organizations')
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return false;
		}

		return isOwnerOrAdminModel(ctx, {
			userId,
			organizationId: args.organizationId
		});
	}
});
