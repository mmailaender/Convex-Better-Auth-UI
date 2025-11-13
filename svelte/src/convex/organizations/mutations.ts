import { ConvexError, v } from 'convex/values';
import { internalMutation, mutation } from '../_generated/server';
import { authComponent, createAuth } from '../auth';
import { APIError } from 'better-auth/api';
import { createOrganizationModel, updateOrganizationProfileModel } from '../model/organizations';

/**
 * Creates a new organization with the given name, slug, and optional logo
 */
export const createOrganization = mutation({
	args: {
		name: v.string(),
		slug: v.string(),
		logoId: v.optional(v.id('_storage')),
		skipActiveOrganization: v.optional(v.boolean())
	},
	// TODO: Change to Id<'organization'> when Convex better-auth supports it
	handler: async (ctx, args): Promise<string> => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) {
			throw new ConvexError('Not authenticated');
		}

		return await createOrganizationModel(ctx, {
			userId: user._id,
			name: args.name,
			slug: args.slug,
			logoId: args.logoId
		});
	}
});

export const _createOrganization = internalMutation({
	args: {
		userId: v.string(),
		name: v.string(),
		slug: v.string(),
		logoId: v.optional(v.id('_storage')),
		skipActiveOrganization: v.optional(v.boolean())
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
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) throw new ConvexError('Not authenticated');

		const auth = createAuth(ctx);

		if (args.organizationId) {
			try {
				await auth.api.setActiveOrganization({
					body: {
						organizationId: args.organizationId
					},
					headers: await authComponent.getHeaders(ctx)
				});

				await auth.api.updateUser({
					body: {
						activeOrganizationId: args.organizationId
					},
					headers: await authComponent.getHeaders(ctx)
				});
			} catch (error) {
				if (error instanceof APIError) {
					throw new ConvexError(`${error.statusCode} ${error.status} ${error.message}`);
				}
			}
		} else {
			try {
				const organizations = await auth.api.listOrganizations({
					headers: await authComponent.getHeaders(ctx)
				});
				if (organizations.length === 0) {
					throw new ConvexError('No organizations found');
				}

				if (user.activeOrganizationId) {
					const org = (
						await auth.api.listOrganizations({
							headers: await authComponent.getHeaders(ctx)
						})
					).find((org) => org.id === user.activeOrganizationId);
					if (org) {
						await auth.api.setActiveOrganization({
							body: {
								organizationId: org.id
							},
							headers: await authComponent.getHeaders(ctx)
						});
					}
				} else {
					const betterAuthOrg = organizations[0];
					await auth.api.setActiveOrganization({
						body: {
							organizationId: betterAuthOrg.id
						},
						headers: await authComponent.getHeaders(ctx)
					});
					await auth.api.updateUser({
						body: {
							activeOrganizationId: betterAuthOrg.id
						}
					});
				}
			} catch (error) {
				if (error instanceof APIError) {
					throw new ConvexError(`${error.statusCode} ${error.status} ${error.message}`);
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
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) throw new ConvexError('Not authenticated');

		const auth = createAuth(ctx);
		const organization = await auth.api.getFullOrganization({
			query: {
				organizationId: args.organizationId
			},
			headers: await authComponent.getHeaders(ctx)
		});

		if (!organization) {
			throw new ConvexError('Organization not found');
		}

		// Get all organizations before deletion to check count and find next active org
		const allOrganizations = await auth.api.listOrganizations({
			headers: await authComponent.getHeaders(ctx)
		});

		// Check if at least two organizations exist
		if (allOrganizations.length < 2) {
			throw new ConvexError('Cannot delete organization. At least one organization must remain.');
		}

		// Find the first organization that is not the one being deleted
		const nextActiveOrg = allOrganizations.find((org) => org.id !== organization.id);

		if (!nextActiveOrg) {
			throw new ConvexError('No alternative organization found to set as active');
		}

		// Delete the organization and logo if it exists
		await auth.api.deleteOrganization({
			body: { organizationId: organization.id },
			headers: await authComponent.getHeaders(ctx)
		});
		if (organization.logoId) {
			await ctx.storage.delete(organization.logoId);
		}

		// Set the first remaining organization as active
		await auth.api.setActiveOrganization({
			body: { organizationId: nextActiveOrg.id },
			headers: await authComponent.getHeaders(ctx)
		});

		// Update user's active organization in the database
		await auth.api.updateUser({
			body: {
				activeOrganizationId: nextActiveOrg.id
			},
			headers: await authComponent.getHeaders(ctx)
		});
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
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) throw new ConvexError('Not authenticated');

		const auth = createAuth(ctx);
		const organization = await auth.api.getFullOrganization({
			headers: await authComponent.getHeaders(ctx)
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
