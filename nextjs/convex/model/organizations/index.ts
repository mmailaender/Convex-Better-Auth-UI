import { ConvexError } from 'convex/values';

// Types
import type { MutationCtx, QueryCtx } from '../../_generated/server';
import type { Id } from '../../_generated/dataModel';

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
	// Check if the base slug already exists.
	let candidate: string = baseSlug;
	let counter = 2;
	while (
		(await ctx.db
			.query('organizations')
			.filter((q) => q.eq(q.field('slug'), candidate))
			.first()) !== null
	) {
		candidate = `${baseSlug}-${counter}`;
		counter++;
	}
	return candidate;
};

/**
 * Get all organizations for the current user
 */
export const getUserOrganizationsModel = async (ctx: QueryCtx, args: { userId: Id<'users'> }) => {
	const { userId } = args;
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
};

/**
 * Gets the current user's role in the specified organization
 * If organizationId is not provided, it will use the user's active organization
 * @returns The user's role in the organization or null if not a member or if no active organization exists when organizationId is not provided
 */
export const getOrganizationRoleModel = async (
	ctx: QueryCtx,
	args: { organizationId?: Id<'organizations'>; userId: Id<'users'> }
) => {
	let organizationId = args.organizationId;
	if (!organizationId) {
		const activeOrganization = await getActiveOrganizationModel(ctx, { userId: args.userId });
		if (!activeOrganization) {
			return null;
		}
		organizationId = activeOrganization._id;
	}

	const membership = await ctx.db
		.query('organizationMembers')
		.withIndex('orgId_and_userId', (q) =>
			q.eq('organizationId', organizationId).eq('userId', args.userId)
		)
		.first();

	if (!membership) {
		return null;
	}

	return membership.role;
};

/**
 * Gets the active organization for the current user
 */
export const getActiveOrganizationModel = async (ctx: QueryCtx, args: { userId: Id<'users'> }) => {
	const { userId } = args;

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
};

/**
 * Creates a new organization with the given name, slug, and optional logo
 */
export const createOrganizationModel = async (
	ctx: MutationCtx,
	args: { userId: Id<'users'>; name: string; slug: string; logoId?: Id<'_storage'> }
) => {
	const { userId, name, slug, logoId } = args;

	// Ensure slug is unique across organizations
	const uniqueSlug: string = await getUniqueOrganizationSlug(ctx, slug);

	// Create the organization
	const organizationId = await ctx.db.insert('organizations', {
		name,
		slug: uniqueSlug,
		logoId,
		plan: 'Free' // Default plan
	});

	// Add the creator as an owner
	await ctx.db.insert('organizationMembers', {
		organizationId,
		userId,
		role: 'role_organization_owner'
	});

	// Set the new organization as active
	await ctx.db.patch(userId, {
		activeOrganizationId: organizationId
	});

	return organizationId;
};

/**
 * Sets the active organization for a given user. Performs validation that the
 * user is a member of the organization.
 */
export const setActiveOrganizationModel = async (
	ctx: MutationCtx,
	args: { userId: Id<'users'>; organizationId: Id<'organizations'> }
): Promise<void> => {
	const { userId, organizationId } = args;

	await ctx.db.patch(userId, { activeOrganizationId: organizationId });
};

/**
 * Removes a user from an organization, taking care of role ownership edge
 * cases and updating their active organization selection if necessary.
 */
export const leaveOrganizationModel = async (
	ctx: MutationCtx,
	args: {
		userId: Id<'users'>;
		organizationId: Id<'organizations'>;
		membershipId: Id<'organizationMembers'>;
		role: string;
	}
): Promise<boolean> => {
	const { userId, organizationId, membershipId, role } = args;

	// Prevent leaving if sole owner
	if (role === 'role_organization_owner') {
		const otherOwners = await ctx.db
			.query('organizationMembers')
			.filter((q) =>
				q.and(
					q.eq(q.field('organizationId'), organizationId),
					q.eq(q.field('role'), 'role_organization_owner'),
					q.neq(q.field('userId'), userId)
				)
			)
			.collect();

		if (otherOwners.length === 0) {
			throw new ConvexError(
				'Cannot leave organization as the only owner. Transfer ownership first or delete the organization.'
			);
		}
	}

	// Remove membership record
	await ctx.db.delete(membershipId);

	// Update active organization if this was active
	const user = await ctx.db.get(userId);
	if (user && user.activeOrganizationId === organizationId) {
		const otherMemberships = await ctx.db
			.query('organizationMembers')
			.withIndex('userId', (q) => q.eq('userId', userId))
			.collect();

		const newActiveId = otherMemberships[0]?.organizationId;
		await ctx.db.patch(userId, { activeOrganizationId: newActiveId });
	}

	return true;
};

/**
 * Updates an organization's profile (name, slug, logo). The user must have an
 * admin or owner role in the organization.
 */
export const updateOrganizationProfileModel = async (
	ctx: MutationCtx,
	args: {
		organizationId: Id<'organizations'>;
		name?: string;
		slug?: string;
		logoId?: Id<'_storage'>;
	}
): Promise<void> => {
	const { organizationId, name, slug, logoId } = args;

	if (logoId !== undefined) {
		const organization = await ctx.db.get(organizationId);
		if (!organization) {
			throw new ConvexError('Organization not found');
		}

		if (organization.logoId && logoId !== organization.logoId) {
			await ctx.storage.delete(organization.logoId);
		}
	}

	const updateData: Partial<{ name: string; slug: string; logoId: Id<'_storage'> }> = {};
	if (name !== undefined) updateData.name = name;
	if (slug !== undefined) updateData.slug = slug;
	if (logoId !== undefined) updateData.logoId = logoId;

	if (Object.keys(updateData).length > 0) {
		await ctx.db.patch(organizationId, updateData);
	}
};

/**
 * Deletes an organization and cleans up associated data (memberships,
 * invitations, logo storage, and users' active organization field).
 */
export const deleteOrganizationModel = async (
	ctx: MutationCtx,
	args: { organizationId: Id<'organizations'> }
): Promise<boolean> => {
	const { organizationId } = args;

	const organization = await ctx.db.get(organizationId);
	if (!organization) {
		throw new ConvexError('Organization not found');
	}

	if (organization.logoId) {
		await ctx.storage.delete(organization.logoId);
	}

	const members = await ctx.db
		.query('organizationMembers')
		.withIndex('orgId', (q) => q.eq('organizationId', organizationId))
		.collect();

	for (const member of members) {
		const memberUser = await ctx.db.get(member.userId);
		if (memberUser && memberUser.activeOrganizationId === organizationId) {
			const otherMemberships = await ctx.db
				.query('organizationMembers')
				.withIndex('userId', (q) => q.eq('userId', member.userId))
				.filter((q) => q.neq(q.field('organizationId'), organizationId))
				.collect();

			await ctx.db.patch(member.userId, {
				activeOrganizationId: otherMemberships[0]?.organizationId
			});
		}

		await ctx.db.delete(member._id);
	}

	const invitations = await ctx.db
		.query('invitations')
		.withIndex('by_org_and_email', (q) => q.eq('organizationId', organizationId))
		.collect();

	for (const invitation of invitations) {
		await ctx.db.delete(invitation._id);
	}

	await ctx.db.delete(organizationId);

	return true;
};
