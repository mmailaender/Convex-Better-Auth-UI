import { v } from 'convex/values';
import { mutation, type MutationCtx } from './_generated/server';
import { partial, withSystemFields } from 'convex-helpers/validators';
import { omit } from 'convex-helpers';
import schema from './schema';
import { type Doc, type Id } from './_generated/dataModel';
import { ConvexError } from 'convex/values';

/**
 * Deletes all organization data associated with a user.
 * * Delete Organizations membership where the user role is not owner
 * * Delete Invitations where the user is the invitee
 * * Delete Organizations where the user is the owner and only member (If there are other members, throw error)
 *
 * Returns the `logoId`s of the deleted organizations for the caller to delete: logos live in
 * the app's file storage, which this component can't reach.
 */
export const deleteUser = mutation({
	args: v.object(withSystemFields('user', schema.tables.user.validator.fields)),
	returns: v.array(v.string()),
	handler: async (ctx, args) => {
		const ownerMemberships: Doc<'member'>[] = [];
		const logoIds: string[] = [];

		// 1) Delete organization memberships where the user is NOT the owner.
		const memberships = ctx.db.query('member').withIndex('userId', (q) => q.eq('userId', args._id));

		for await (const membership of memberships) {
			// Better Auth stores a member's roles as a comma-separated string
			if (membership.role.split(',').some((role) => role.trim() === 'owner')) {
				ownerMemberships.push(membership);
			} else {
				await ctx.db.delete('member', membership._id);
			}
		}

		// 2) For organizations where the user IS the owner, only delete the organization
		//    if they are the sole member. Otherwise, throw an error.
		for (const membership of ownerMemberships) {
			// Count members in this organization.
			const orgMembers = await ctx.db
				.query('member')
				.withIndex('organizationId', (q) => q.eq('organizationId', membership.organizationId))
				.take(2);

			if (orgMembers.length > 1) {
				// User owns an org that has other members. Abort with a helpful error.
				throw new ConvexError(
					'Cannot delete user: You are the owner of an organization that has other members. Transfer ownership or remove other members first.'
				);
			}

			// Safe to delete: first delete the owner's membership, then the organization.
			await ctx.db.delete('member', membership._id);

			const orgId = membership.organizationId as Id<'organization'>;
			const org = await ctx.db.get('organization', orgId);
			if (org) {
				if (org.logoId) {
					logoIds.push(org.logoId);
				}
				await ctx.db.delete('organization', orgId);
			}
		}

		// 3) Delete invitations where the user is the invitee (by email).
		const invitations = ctx.db
			.query('invitation')
			.withIndex('email', (q) => q.eq('email', args.email));

		for await (const invitation of invitations) {
			await ctx.db.delete('invitation', invitation._id);
		}

		return logoIds;
	}
});

/** Whether the organization still exists and the user is still one of its members. */
async function belongsTo(ctx: MutationCtx, userId: Id<'user'>, organizationId: string) {
	const id = ctx.db.normalizeId('organization', organizationId);
	if (!id || !(await ctx.db.get('organization', id))) return false;
	const member = await ctx.db
		.query('member')
		.withIndex('organizationId_userId', (q) =>
			q.eq('organizationId', organizationId).eq('userId', userId)
		)
		.first();
	return member !== null;
}

/**
 * The user's `activeOrganizationId` is the one source of the active organization. Each session
 * keeps a copy because Better Auth's organization endpoints fall back to it when a call names no
 * organization; writing both here, in one transaction, keeps every session of the user on the
 * user's organization.
 *
 * The membership is checked here, in the writing transaction: Better Auth checks it in an
 * earlier one, so a member who left `requested` in between would otherwise make it active
 * again. A requested organization the user no longer belongs to leaves the current one, if the
 * user still belongs to that, and otherwise none.
 */
async function writeActiveOrganization(
	ctx: MutationCtx,
	userId: Id<'user'>,
	requested: string | null
): Promise<void> {
	const user = await ctx.db.get('user', userId);
	if (!user) return;
	const current = user.activeOrganizationId ?? null;
	let organizationId: string | null = null;
	if (requested !== null && (await belongsTo(ctx, userId, requested))) organizationId = requested;
	else if (requested !== null && current !== null && (await belongsTo(ctx, userId, current)))
		organizationId = current;

	if (current !== organizationId) {
		await ctx.db.patch('user', userId, { activeOrganizationId: organizationId });
	}
	const sessions = ctx.db.query('session').withIndex('userId', (q) => q.eq('userId', userId));
	for await (const session of sessions) {
		if (session.activeOrganizationId !== organizationId) {
			await ctx.db.patch('session', session._id, { activeOrganizationId: organizationId });
		}
	}
}

/**
 * Makes `organizationId` the user's active organization, on the user and on every one of the
 * user's sessions, if the user belongs to it (see `writeActiveOrganization`).
 */
export const setUserActiveOrganization = mutation({
	args: { userId: v.id('user'), organizationId: v.union(v.null(), v.string()) },
	returns: v.null(),
	handler: async (ctx, { userId, organizationId }) => {
		await writeActiveOrganization(ctx, userId, organizationId);
		return null;
	}
});

/**
 * Gives a new session the user's active organization. A user without one, or with one they no
 * longer belong to, gets their first membership, on the user and all of their sessions.
 */
export const setActiveOrganization = mutation({
	args: { userId: v.id('user'), sessionId: v.id('session') },
	returns: v.null(),
	handler: async (ctx, { userId, sessionId }) => {
		const user = await ctx.db.get('user', userId);
		if (!user) return null;

		const session = await ctx.db.get('session', sessionId);
		if (!session || session.userId !== userId) return null;

		const current = user.activeOrganizationId;
		if (current && (await belongsTo(ctx, userId, current))) {
			if (session.activeOrganizationId !== current) {
				await ctx.db.patch('session', sessionId, { activeOrganizationId: current });
			}
			return null;
		}

		const membership = await ctx.db
			.query('member')
			.withIndex('userId', (q) => q.eq('userId', userId))
			.first(); // Note: no guaranteed ordering.
		await writeActiveOrganization(ctx, userId, membership?.organizationId ?? null);
		return null;
	}
});

/**
 * Dedicated updateOrganization mutation as auth.api.updateOrganization needs an authenticated user.
 */
export const updateOrganization = mutation({
	args: {
		organizationId: v.id('organization'),
		data: v.object(partial(omit(schema.tables.organization.validator.fields, ['createdAt'])))
	},
	returns: v.null(),
	handler: async (ctx, { organizationId, data }) => {
		await ctx.db.patch('organization', organizationId, data);
		return null;
	}
});
