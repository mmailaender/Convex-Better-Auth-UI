import { ConvexError, v } from 'convex/values';
import { internalMutation, mutation } from '../_generated/server';
import { betterAuthComponent } from '../auth';
import { APIError } from 'better-auth/api';
import { createOrganizationModel, updateOrganizationProfileModel } from '../model/organizations';

// Types
import type { Id } from '../_generated/dataModel';
import { createAuth } from '../../src/components/auth/lib/auth';

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
		const userId = await betterAuthComponent.getAuthUserId(ctx);
		if (!userId) {
			throw new ConvexError('Not authenticated');
		}

		return await createOrganizationModel(ctx, {
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
 * Sets the active organization for the current user. If no organizationId is provided, try getting the activeOrganization from user table, if not found, the first organization in the list will be set as active.
 */
export const setActiveOrganization = mutation({
	args: {
		organizationId: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const userId = await betterAuthComponent.getAuthUserId(ctx);
		if (!userId) throw new ConvexError('Not authenticated');

		const auth = createAuth(ctx);

		if (args.organizationId) {
			try {
				const organizationId = args.organizationId;
				await auth.api.setActiveOrganization({
					body: {
						organizationId: args.organizationId
					},
					headers: await betterAuthComponent.getHeaders(ctx)
				});
				const user = await ctx.db.get(userId as Id<'users'>);
				const org = await ctx.db
					.query('organizations')
					.withIndex('betterAuthId', (q) => q.eq('betterAuthId', organizationId))
					.first();
				if (user && org) {
					await ctx.db.patch(user._id, {
						activeOrganizationId: org._id
					});
				}
			} catch (error) {
				if (error instanceof APIError) {
					throw new ConvexError(error.message);
				}
			}
		} else {
			try {
				const organizations = await auth.api.listOrganizations({
					headers: await betterAuthComponent.getHeaders(ctx)
				});
				if (organizations.length === 0) {
					throw new ConvexError('No organizations found');
				}

				const user = await ctx.db.get(userId as Id<'users'>);
				if (!user) {
					throw new ConvexError('User not found');
				}

				if (user.activeOrganizationId) {
					const org = (
						await auth.api.listOrganizations({
							headers: await betterAuthComponent.getHeaders(ctx)
						})
					).find((org) => org.id === user.activeOrganizationId);
					if (org) {
						await auth.api.setActiveOrganization({
							body: {
								organizationId: org.id
							},
							headers: await betterAuthComponent.getHeaders(ctx)
						});
					}
				} else {
					const betterAuthOrg = organizations[0];
					await auth.api.setActiveOrganization({
						body: {
							organizationId: betterAuthOrg.id
						},
						headers: await betterAuthComponent.getHeaders(ctx)
					});
					const org = (
						await auth.api.listOrganizations({
							headers: await betterAuthComponent.getHeaders(ctx)
						})
					).find((org) => org.id === betterAuthOrg.id);
					if (user && org) {
						await ctx.db.patch(user._id, {
							activeOrganizationId: org.id
						});
					}
				}
			} catch (error) {
				if (error instanceof APIError) {
					throw new ConvexError(error.message);
				}
			}
		}
	}
});

export const deleteOrganization = mutation({
	args: {
		organizationId: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const userId = await betterAuthComponent.getAuthUserId(ctx);
		if (!userId) throw new ConvexError('Not authenticated');

		let organizationId = args.organizationId;
		const auth = createAuth(ctx);

		// If no organizationId provided, get the current active organization
		if (!organizationId) {
			organizationId = (
				await auth.api.getFullOrganization({
					headers: await betterAuthComponent.getHeaders(ctx)
				})
			)?.id;
		}

		if (!organizationId) {
			throw new ConvexError('Organization not found');
		}

		// Get all organizations before deletion to check count and find next active org
		const allOrganizations = await auth.api.listOrganizations({
			headers: await betterAuthComponent.getHeaders(ctx)
		});

		// Check if at least two organizations exist
		if (allOrganizations.length < 2) {
			throw new ConvexError('Cannot delete organization. At least one organization must remain.');
		}

		// Find the first organization that is not the one being deleted
		const nextActiveOrg = allOrganizations.find((org) => org.id !== organizationId);

		if (!nextActiveOrg) {
			throw new ConvexError('No alternative organization found to set as active');
		}

		// Delete the organization
		await auth.api.deleteOrganization({
			body: { organizationId },
			headers: await betterAuthComponent.getHeaders(ctx)
		});

		// Delete organization also from convex app table and storage
		// TODO: Remove as soon as convex better-auth supports additional organization fields
		const appOrg = await ctx.db
			.query('organizations')
			.withIndex('betterAuthId', (q) => q.eq('betterAuthId', organizationId))
			.first();
		if (appOrg) {
			await ctx.db.delete(appOrg._id);
			if (appOrg.logoId) {
				await ctx.storage.delete(appOrg.logoId);
			}
		}

		// Set the first remaining organization as active
		await auth.api.setActiveOrganization({
			body: { organizationId: nextActiveOrg.id },
			headers: await betterAuthComponent.getHeaders(ctx)
		});

		// Update user's active organization in the database
		const user = await ctx.db.get(userId as Id<'users'>);
		if (user) {
			await ctx.db.patch(user._id, {
				activeOrganizationId: nextActiveOrg.id
			});
		}
	}
});

/**
 * Updates an organization's profile information
 */
export const updateOrganizationProfile = mutation({
	args: {
		name: v.optional(v.string()),
		slug: v.optional(v.string()),
		logoId: v.optional(v.id('_storage'))
	},
	handler: async (ctx, args) => {
		// const userId = await getAuthUserId(ctx);
		const userId = await betterAuthComponent.getAuthUserId(ctx);
		if (!userId) throw new ConvexError('Not authenticated');

		const auth = createAuth(ctx);
		const organization = await auth.api.getFullOrganization({
			headers: await betterAuthComponent.getHeaders(ctx)
		});
		if (!organization) {
			throw new ConvexError('Organization not found');
		}

		try {
			await updateOrganizationProfileModel(ctx, {
				organizationId: organization.id,
				name: args.name,
				slug: args.slug,
				logoId: args.logoId
			});
		} catch (error) {
			if (error instanceof ConvexError) {
				throw error;
			}
			throw new ConvexError(`Failed to update organization profile: ${error}`);
		}
	}
});
