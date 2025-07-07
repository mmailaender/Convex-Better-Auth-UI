import { getAuthUserId } from '@convex-dev/auth/server';
import { query } from '../_generated/server';
import {
	getUserOrganizationsModel,
	getActiveOrganizationModel,
	getOrganizationRoleModel
} from '../model/organizations';
import { v } from 'convex/values';

/**
 * Get all organizations for the current user
 */
export const getUserOrganizations = query({
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		return getUserOrganizationsModel(ctx, { userId });
	}
});

/**
 * Gets the current user's role in the specified organization
 * If organizationId is not provided, it will use the user's active organization
 * @returns The user's role in the organization or null if not a member or if no active organization exists when organizationId is not provided
 */
export const getOrganizationRole = query({
	args: {
		organizationId: v.optional(v.id('organizations'))
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}

		return getOrganizationRoleModel(ctx, { organizationId: args.organizationId, userId });
	}
});

/**
 * Gets the active organization for the current user
 */
export const getActiveOrganization = query({
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}

		return getActiveOrganizationModel(ctx, { userId });
	}
});
