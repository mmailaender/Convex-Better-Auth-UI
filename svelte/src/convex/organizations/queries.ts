// Convex queries for organizations domain.
// TODO: Migrate query functions from ../organizations.ts into this file.

import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';
import { query } from '../_generated/server';

/**
 * Get all organizations for the current user
 */
export const getUserOrganizations = query({
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		// Get all organization memberships for the user
		const memberships = await ctx.db
			.query('organizationMembers')
			.withIndex('userId', (q) => q.eq('userId', userId))
			.collect();

		// Get the actual organizations
		const organizations = await Promise.all(
			memberships.map(async (membership) => {
				const org = await ctx.db.get(membership.organizationId);
				if (!org) return null;

				// Add the logo URL if applicable
				if (org.logoId) {
					org.logo = (await ctx.storage.getUrl(org.logoId)) ?? undefined;
				}

				return {
					...org,
					role: membership.role
				};
			})
		);

		return organizations;
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

		// Get the user to see if they have an active organization
		const user = await ctx.db.get(userId);
		if (!user || !user.activeOrganizationId) {
			// No active organization set, try to get the first organization
			const memberships = await ctx.db
				.query('organizationMembers')
				.withIndex('userId', (q) => q.eq('userId', userId))
				.collect();

			if (memberships.length === 0) {
				return null;
			}

			// Use the first organization as active by default
			const org = await ctx.db.get(memberships[0].organizationId);
			if (!org) return null;

			// Add the logo URL if applicable
			if (org.logoId) {
				org.logo = (await ctx.storage.getUrl(org.logoId)) ?? undefined;
			}

			return {
				...org,
				role: memberships[0].role
			};
		}

		// Get the active organization
		const org = await ctx.db.get(user.activeOrganizationId);
		if (!org) return null;

		// Find the user's role in this organization
		const membership = await ctx.db
			.query('organizationMembers')
			.withIndex('orgId_and_userId', (q) => q.eq('organizationId', org._id).eq('userId', userId))
			.first();
		if (!membership) {
			return null;
		}

		// Add the logo URL if applicable
		if (org.logoId) {
			org.logo = (await ctx.storage.getUrl(org.logoId)) ?? undefined;
		}

		return {
			...org,
			role: membership.role
		};
	}
});
