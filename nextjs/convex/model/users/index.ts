import { ConvexError } from 'convex/values';
// import { deleteOrganizationModel } from '../organizations';

// Types
import type { MutationCtx, QueryCtx } from '../../_generated/server';
import type { WithoutSystemFields } from 'convex/server';
import type { Doc, Id } from '../../_generated/dataModel';
import { createAuth } from '../../../src/components/auth/lib/auth';
import { betterAuthComponent } from '../../auth';

/**
 * Extract the first name from a user's full name.
 * Falls back to "Unknown" when the name is not provided.
 *
 * @param user - A user document or null/undefined.
 * @returns The first name string.
 */
export const getUserFirstName = (name: string | null | undefined): string => {
	const fullName: string | undefined = name ?? undefined;
	if (!fullName) {
		return 'Unknown';
	}
	return fullName.trim().split(/\s+/)[0] ?? 'Unknown';
};

/**
 * Update the user's avatar storage reference.
 */
export const updateAvatarModel = async (
	ctx: MutationCtx,
	args: { userId: Id<'users'>; storageId: Id<'_storage'> }
) => {
	const { userId, storageId } = args;

	const user = await ctx.db.get(userId);
	if (!user) {
		throw new ConvexError('User not found');
	}

	if (user.imageId && user.imageId !== storageId) {
		await ctx.storage.delete(user.imageId);
	}

	const imageUrl = await ctx.storage.getUrl(args.storageId);

	if (!imageUrl) {
		throw new ConvexError('Failed to get image URL');
	}

	const auth = createAuth(ctx);
	await auth.api.updateUser({
		body: { image: imageUrl },
		headers: await betterAuthComponent.getHeaders(ctx)
	});

	await patchUserModel(ctx, { userId, data: { imageId: storageId } });

	return imageUrl;
};

/**
 * Patch (update) arbitrary fields on a user document. All validation and auth
 * checks must be performed by the caller (i.e. the mutation handler).
 *
 * @returns The user document id that was patched.
 */
export const patchUserModel = async (
	ctx: MutationCtx,
	args: { userId: Id<'users'>; data: Partial<WithoutSystemFields<Doc<'users'>>> }
) => {
	const { userId, data } = args;

	const patchData = Object.fromEntries(
		Object.entries(data).map(([key, value]) => [key, value === null ? undefined : value])
	);

	await ctx.db.patch(userId, patchData);
	return userId;
};

// /**
//  * Deletes a user and performs all cascading clean-up:
//  * 1. Handles organization membership/ownership edge cases.
//  * 2. Removes linked authentication provider accounts.
//  * 3. Deletes the user's profile image from storage (if any).
//  * 4. Deletes the user document itself.
//  *
//  * The caller MUST ensure this action is authorised.
//  */
// export const deleteUserModel = async (ctx: MutationCtx, args: { userId: Id<'users'> }) => {
// 	const { userId } = args;

// 	// 1. Handle organization memberships
// 	const memberships = await ctx.db
// 		.query('organizationMembers')
// 		.withIndex('userId', (q) => q.eq('userId', userId))
// 		.collect();

// 	for (const membership of memberships) {
// 		// How many members does the organization have?
// 		const orgMembers = await ctx.db
// 			.query('organizationMembers')
// 			.withIndex('orgId', (q) => q.eq('organizationId', membership.organizationId))
// 			.collect();

// 		const isOwner: boolean = membership.role === 'role_organization_owner';
// 		const isOnlyMember: boolean = orgMembers.length === 1;

// 		if (isOwner) {
// 			if (isOnlyMember) {
// 				// Sole owner and sole member – delete the organization entirely.
// 				await deleteOrganizationModel(ctx, { organizationId: membership.organizationId });
// 				continue;
// 			} else {
// 				throw new ConvexError(
// 					'Cannot delete user: you are the owner of an organization that still has other members. Transfer ownership or delete the organization first.'
// 				);
// 			}
// 		}

// 		// Non-owner membership – just remove membership record.
// 		await ctx.db.delete(membership._id);
// 	}

// 	// 2. Delete linked authentication provider accounts
// 	const authAccounts = await ctx.db
// 		.query('authAccounts')
// 		.filter((q) => q.eq(q.field('userId'), userId))
// 		.collect();

// 	for (const account of authAccounts) {
// 		await ctx.db.delete(account._id);
// 	}

// 	// 3. Remove profile image from storage if present
// 	const user = await ctx.db.get(userId);
// 	if (user?.imageId) {
// 		await ctx.storage.delete(user.imageId);
// 	}

// 	// 4. Finally delete user document
// 	await ctx.db.delete(userId);

// 	return true;
// };

/**
 * Check if a user with the given email exists.
 */
export const isUserExistingModel = async (ctx: QueryCtx, args: { email: string }) => {
	const { email } = args;

	const user = await ctx.db
		.query('users')
		.filter((q) => q.eq(q.field('email'), email))
		.first();
	return user !== null;
};
