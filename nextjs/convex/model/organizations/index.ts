import { ConvexError } from 'convex/values';
import { betterAuthComponent } from '../../auth';
import { createAuth } from '../../../src/components/auth/lib/auth';

// Types
import type { MutationCtx, QueryCtx } from '../../_generated/server';
import type { Doc, Id } from '../../_generated/dataModel';
import { APIError } from 'better-auth/api';

/**
 * Ensure the organization slug is unique by appending an incrementing postfix
 * ("-2", "-3", ...). If the base slug does not exist, it is returned
 * unchanged.
 *
 * @param ctx - Convex context with database access.
 * @param baseSlug - Desired slug (e.g. "john-projects").
 * @returns A unique slug guaranteed not to collide with existing organizations.
 */
export const getUniqueOrganizationSlug = async (
	ctx: QueryCtx | MutationCtx,
	baseSlug: string
): Promise<string> => {
	const auth = createAuth(ctx);
	// Check if the base slug already exists.
	let candidate: string = baseSlug;
	let counter = 2;

	const isSlugTaken = async (slug: string) => {
		try {
			await auth.api.checkOrganizationSlug({
				body: {
					slug
				}
			});
			return false;
		} catch {
			return true;
		}
	};

	while ((await isSlugTaken(candidate)) === true) {
		candidate = `${baseSlug}-${counter}`;
		counter++;
	}
	return candidate;
};

// /**
//  * Gets the current user's role in the specified organization
//  * If organizationId is not provided, it will use the user's active organization
//  * @returns The user's role in the organization or null if not a member or if no active organization exists when organizationId is not provided
//  */
// export const getOrganizationRoleModel = async (
// 	ctx: QueryCtx,
// 	args: { organizationId?: Id<'organizations'>; userId: Id<'users'> }
// ) => {
// 	let organizationId = args.organizationId;
// 	if (!organizationId) {
// 		const activeOrganization = await getActiveOrganizationModel(ctx, { userId: args.userId });
// 		if (!activeOrganization) {
// 			return null;
// 		}
// 		organizationId = activeOrganization._id;
// 	}

// 	const membership = await ctx.db
// 		.query('organizationMembers')
// 		.withIndex('orgId_and_userId', (q) =>
// 			q.eq('organizationId', organizationId).eq('userId', args.userId)
// 		)
// 		.first();

// 	if (!membership) {
// 		return null;
// 	}

// 	return membership.role;
// };

/**
 * Creates a new organization with the given name, slug, and optional logo
 */
export const createOrganizationModel = async (
	ctx: MutationCtx,
	args: { name: string; slug: string; logoId?: Id<'_storage'> }
) => {
	const { name, slug, logoId } = args;

	// Ensure slug is unique across organizations
	const uniqueSlug: string = await getUniqueOrganizationSlug(ctx, slug);

	let imageUrl;
	if (logoId) {
		imageUrl = await ctx.storage.getUrl(logoId);
	}

	// Create the organization
	const auth = createAuth(ctx);
	let org: typeof auth.$Infer.Organization | null = null;

	// Step 1: Create the organization in Better Auth
	try {
		org = await auth.api.createOrganization({
			body: {
				name,
				slug: uniqueSlug,
				logo: imageUrl ?? undefined
			},
			headers: await betterAuthComponent.getHeaders(ctx)
		});

		// TODO: Move logoId to better-auth as soon v0.8 launches with organization.additionalFields support
		await ctx.db.insert('organizations', {
			betterAuthId: org!.id,
			logoId
		});
	} catch (error) {
		if (error instanceof APIError) {
			console.log(error.message, error.status);
			throw new ConvexError(error.message);
		}
		console.error('Unexpected error creating organization:', error);
		throw new ConvexError('An unexpected error occurred while creating the organization');
	}

	// Step 2: Set the new organization as active

	// Ensure organization was created successfully before proceeding
	if (!org) {
		throw new ConvexError('Organization creation failed - no organization data returned');
	}

	try {
		await auth.api.setActiveOrganization({
			body: {
				organizationId: org.id
			},
			headers: await betterAuthComponent.getHeaders(ctx)
		});
	} catch (error) {
		if (error instanceof APIError) {
			console.log(error.message, error.status);
			throw new ConvexError(error.message);
		}
		console.error('Unexpected error setting active organization:', error);
		throw new ConvexError('An unexpected error occurred while setting the organization as active');
	}

	return org.id as Id<'organizations'>;
};

// /**
//  * Removes a user from an organization, taking care of role ownership edge
//  * cases and updating their active organization selection if necessary.
//  */
// export const leaveOrganizationModel = async (
// 	ctx: MutationCtx,
// 	args: {
// 		userId: Id<'users'>;
// 		organizationId: Id<'organizations'>;
// 		membershipId: Id<'organizationMembers'>;
// 		role: string;
// 	}
// ): Promise<boolean> => {
// 	const { userId, organizationId, membershipId, role } = args;

// 	// Prevent leaving if sole owner
// 	if (role === 'role_organization_owner') {
// 		const otherOwners = await ctx.db
// 			.query('organizationMembers')
// 			.filter((q) =>
// 				q.and(
// 					q.eq(q.field('organizationId'), organizationId),
// 					q.eq(q.field('role'), 'role_organization_owner'),
// 					q.neq(q.field('userId'), userId)
// 				)
// 			)
// 			.collect();

// 		if (otherOwners.length === 0) {
// 			throw new ConvexError(
// 				'Cannot leave organization as the only owner. Transfer ownership first or delete the organization.'
// 			);
// 		}
// 	}

// 	// Remove membership record
// 	await ctx.db.delete(membershipId);

// 	// Update active organization if this was active
// 	const user = await ctx.db.get(userId);
// 	if (user && user.activeOrganizationId === organizationId) {
// 		const otherMemberships = await ctx.db
// 			.query('organizationMembers')
// 			.withIndex('userId', (q) => q.eq('userId', userId))
// 			.collect();

// 		const newActiveId = otherMemberships[0]?.organizationId;
// 		await ctx.db.patch(userId, { activeOrganizationId: newActiveId });
// 	}

// 	return true;
// };

/**
 * Updates an organization's profile (name, slug, logo). The user must have an
 * admin or owner role in the organization.
 */
export const updateOrganizationProfileModel = async (
	ctx: MutationCtx,
	args: {
		organizationId: string;
		name?: string;
		slug?: string;
		logoId?: Id<'_storage'> | null; // Allow null to remove logo
	}
): Promise<void> => {
	const { organizationId, name, slug, logoId } = args;
	const auth = createAuth(ctx);

	// Input validation
	if (name !== undefined && (!name || name.trim().length === 0)) {
		throw new ConvexError('Organization name cannot be empty');
	}
	if (slug !== undefined && (!slug || slug.trim().length === 0 || !/^[a-z0-9-]+$/.test(slug))) {
		throw new ConvexError('Slug must contain only lowercase letters, numbers, and hyphens');
	}

	// Validate slug uniqueness if it's being changed
	if (slug) {
		// Get current organization data from Better Auth
		const currentOrganization = await auth.api.getFullOrganization({
			headers: await betterAuthComponent.getHeaders(ctx)
		});
		if (!currentOrganization) {
			throw new ConvexError('Organization not found');
		}
		if (currentOrganization.slug !== slug) {
			try {
				await auth.api.checkOrganizationSlug({
					body: { slug }
				});
			} catch {
				throw new ConvexError('Slug already taken');
			}
		}
	}

	// Handle logo updates
	let imageUrl: string | undefined;
	let convexOrgToUpdate: Doc<'organizations'> | null = null;

	if (logoId !== undefined) {
		// Get Convex organization record for logo management
		convexOrgToUpdate = await ctx.db
			.query('organizations')
			.withIndex('betterAuthId', (q) => q.eq('betterAuthId', organizationId))
			.first();

		if (!convexOrgToUpdate) {
			throw new ConvexError('Organization record not found in database');
		}

		// Handle logo removal (logoId is null)
		if (logoId === null) {
			if (convexOrgToUpdate.logoId) {
				await ctx.storage.delete(convexOrgToUpdate.logoId);
				await ctx.db.patch(convexOrgToUpdate._id, { logoId: undefined });
			}
			imageUrl = undefined; // This will remove the logo from Better Auth
		}
		// Handle logo addition/update
		else if (logoId !== null && logoId !== convexOrgToUpdate.logoId) {
			// Validate new logo exists and get URL before making changes
			// TypeScript assertion: logoId is guaranteed to be Id<'_storage'> here
			imageUrl = (await ctx.storage.getUrl(logoId as Id<'_storage'>)) ?? undefined;
			if (!imageUrl) {
				throw new ConvexError('Invalid logo file or file not found');
			}

			// Delete old logo if it exists
			if (convexOrgToUpdate.logoId) {
				await ctx.storage.delete(convexOrgToUpdate.logoId);
			}

			// Update Convex record with new logo
			await ctx.db.patch(convexOrgToUpdate._id, { logoId: logoId as Id<'_storage'> });
		}
	}

	// Prepare Better Auth update data
	const betterAuthUpdateData: Parameters<typeof auth.api.updateOrganization>[0]['body']['data'] =
		{};
	if (name !== undefined) betterAuthUpdateData.name = name.trim();
	if (slug !== undefined) betterAuthUpdateData.slug = slug.trim();
	if (logoId !== undefined) {
		// Better Auth expects undefined to remove logo
		betterAuthUpdateData.logo = imageUrl;
	}

	// Update Better Auth if there are changes
	if (Object.keys(betterAuthUpdateData).length > 0) {
		try {
			await auth.api.updateOrganization({
				body: { data: betterAuthUpdateData, organizationId },
				headers: await betterAuthComponent.getHeaders(ctx)
			});
		} catch (error) {
			throw new ConvexError(`Failed to update organization in Better Auth: ${error}`);
		}
	}
};

// /**
//  * Deletes an organization and cleans up associated data (memberships,
//  * invitations, logo storage, and users' active organization field).
//  */
// export const deleteOrganizationModel = async (
// 	ctx: MutationCtx,
// 	args: { organizationId: Id<'organizations'> }
// ): Promise<boolean> => {
// 	const { organizationId } = args;

// 	const organization = await ctx.db.get(organizationId);
// 	if (!organization) {
// 		throw new ConvexError('Organization not found');
// 	}

// 	if (organization.logoId) {
// 		await ctx.storage.delete(organization.logoId);
// 	}

// 	const members = await ctx.db
// 		.query('organizationMembers')
// 		.withIndex('orgId', (q) => q.eq('organizationId', organizationId))
// 		.collect();

// 	for (const member of members) {
// 		const memberUser = await ctx.db.get(member.userId);
// 		if (memberUser && memberUser.activeOrganizationId === organizationId) {
// 			const otherMemberships = await ctx.db
// 				.query('organizationMembers')
// 				.withIndex('userId', (q) => q.eq('userId', member.userId))
// 				.filter((q) => q.neq(q.field('organizationId'), organizationId))
// 				.collect();

// 			await ctx.db.patch(member.userId, {
// 				activeOrganizationId: otherMemberships[0]?.organizationId
// 			});
// 		}

// 		await ctx.db.delete(member._id);
// 	}

// 	const invitations = await ctx.db
// 		.query('invitations')
// 		.withIndex('by_org_and_email', (q) => q.eq('organizationId', organizationId))
// 		.collect();

// 	for (const invitation of invitations) {
// 		await ctx.db.delete(invitation._id);
// 	}

// 	await ctx.db.delete(organizationId);

// 	return true;
// };
