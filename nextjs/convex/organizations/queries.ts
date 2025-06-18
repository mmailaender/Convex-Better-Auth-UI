import { getAuthUserId } from '@convex-dev/auth/server';
import { query } from '../_generated/server';
import { getUserOrganizationsModel, getActiveOrganizationModel } from '../model/organizations';

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
