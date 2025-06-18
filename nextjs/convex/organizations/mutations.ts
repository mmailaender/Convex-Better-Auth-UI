import { ConvexError, v } from 'convex/values';
import { internalMutation, mutation } from '../_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import { Id } from '../_generated/dataModel';
import {
	createOrganizationModel,
	setActiveOrganizationModel,
	leaveOrganizationModel,
	updateOrganizationProfileModel,
	deleteOrganizationModel
} from '../model/organizations';

/**
 * Creates a new organization with the given name, slug, and optional logo
 */
export const createOrganization = mutation({
	args: {
		name: v.string(),
		slug: v.string(),
		logoId: v.optional(v.id('_storage'))
	},
	handler: async (ctx, args): Promise<Id<'organizations'>> => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new ConvexError('Not authenticated');
		}

		return await createOrganizationModel(ctx, {
			userId,
			name: args.name,
			slug: args.slug,
			logoId: args.logoId
		});
	}
});

export const _createOrganization = internalMutation({
	args: {
		userId: v.id('users'),
		name: v.string(),
		slug: v.string(),
		logoId: v.optional(v.id('_storage'))
	},
	handler: async (ctx, args) => {
		return await createOrganizationModel(ctx, args);
	}
});

/**
 * Sets the active organization for the current user
 */
export const setActiveOrganization = mutation({
	args: {
		organizationId: v.id('organizations')
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new ConvexError('Not authenticated');
		// Verify the user is a member of the organization
		const membership = await ctx.db
			.query('organizationMembers')
			.withIndex('orgId_and_userId', (q) =>
				q.eq('organizationId', args.organizationId).eq('userId', userId)
			)
			.first();

		if (!membership) {
			throw new ConvexError('User is not a member of this organization');
		}

		await setActiveOrganizationModel(ctx, { userId, organizationId: args.organizationId });
	}
});

/**
 * Leave an organization (remove yourself as a member)
 */
export const leaveOrganization = mutation({
	args: {
		organizationId: v.id('organizations')
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new ConvexError('Not authenticated');
		// Validate membership exists
		const membership = await ctx.db
			.query('organizationMembers')
			.withIndex('orgId_and_userId', (q) =>
				q.eq('organizationId', args.organizationId).eq('userId', userId)
			)
			.first();
		if (!membership) {
			throw new ConvexError('Not a member of this organization');
		}

		return await leaveOrganizationModel(ctx, {
			userId,
			organizationId: args.organizationId,
			membershipId: membership._id,
			role: membership.role
		});
	}
});

/**
 * Updates an organization's profile information
 */
export const updateOrganizationProfile = mutation({
	args: {
		organizationId: v.id('organizations'),
		name: v.string(),
		slug: v.string(),
		logoId: v.optional(v.id('_storage'))
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new ConvexError('Not authenticated');
		// Validate membership and role
		const membership = await ctx.db
			.query('organizationMembers')
			.withIndex('orgId_and_userId', (q) =>
				q.eq('organizationId', args.organizationId).eq('userId', userId)
			)
			.first();
		if (!membership) {
			throw new ConvexError('User is not a member of this organization');
		}
		if (!['role_organization_owner', 'role_organization_admin'].includes(membership.role)) {
			throw new ConvexError('User does not have permission to update this organization');
		}

		await updateOrganizationProfileModel(ctx, {
			organizationId: args.organizationId,
			name: args.name,
			slug: args.slug,
			logoId: args.logoId
		});
	}
});

/**
 * Updates an organization's profile information
 */
export const _updateOrganizationProfile = internalMutation({
	args: {
		organizationId: v.id('organizations'),
		name: v.optional(v.string()),
		slug: v.optional(v.string()),
		logoId: v.optional(v.id('_storage'))
	},
	handler: async (ctx, args) => {
		await updateOrganizationProfileModel(ctx, args);
	}
});

/**
 * Deletes an organization and updates all members' active organization
 */
export const deleteOrganization = mutation({
	args: {
		organizationId: v.id('organizations')
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new ConvexError('Not authenticated');
		// Validate that the caller is an organization owner
		const membership = await ctx.db
			.query('organizationMembers')
			.withIndex('orgId_and_userId', (q) =>
				q.eq('organizationId', args.organizationId).eq('userId', userId)
			)
			.first();
		if (!membership || membership.role !== 'role_organization_owner') {
			throw new ConvexError('Only organization owners can delete an organization');
		}

		return await deleteOrganizationModel(ctx, { organizationId: args.organizationId });
	}
});
