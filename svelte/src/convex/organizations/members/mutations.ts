import { ConvexError, v } from 'convex/values';
import { mutation } from '../../_generated/server';
import { authComponent, createAuth } from '../../auth';
import { APIError } from 'better-auth/api';
import type { Id } from '../../_generated/dataModel';

/**
 * Leave the current active organization
 * If the user is the owner, a successor must be provided
 * User can only leave if they are part of at least two organizations
 * After leaving, the first remaining organization will be set as active
 */
export const leaveOrganization = mutation({
	args: {
		successorMemberId: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const userId = (await authComponent.safeGetAuthUser(ctx))?.userId as Id<'users'>;
		if (!userId) throw new ConvexError('Not authenticated');

		const auth = createAuth(ctx);

		try {
			// Get all organizations the user is part of
			const allOrganizations = await auth.api.listOrganizations({
				headers: await authComponent.getHeaders(ctx)
			});

			// Check if user is part of at least two organizations
			if (allOrganizations.length < 2) {
				throw new ConvexError(
					'Cannot leave organization. You must be part of at least two organizations.'
				);
			}

			// Get current active member info
			const member = await auth.api.getActiveMember({
				headers: await authComponent.getHeaders(ctx)
			});

			if (!member) {
				throw new ConvexError('Member not found');
			}

			// If user is owner, require a successor
			if (member.role === 'owner') {
				if (!args.successorMemberId) {
					throw new ConvexError('You must provide a successor to leave the organization');
				}

				// Set successor as owner
				await auth.api.updateMemberRole({
					body: {
						organizationId: member.organizationId,
						memberId: args.successorMemberId,
						role: 'owner'
					},
					headers: await authComponent.getHeaders(ctx)
				});
			}

			// Find the first organization that is not the one being left
			const nextActiveOrg = allOrganizations.find((org) => org.id !== member.organizationId);

			if (!nextActiveOrg) {
				throw new ConvexError('No alternative organization found to set as active');
			}

			// Leave the organization
			await auth.api.leaveOrganization({
				body: {
					organizationId: member.organizationId
				},
				headers: await authComponent.getHeaders(ctx)
			});

			// Set the first remaining organization as active
			await auth.api.setActiveOrganization({
				body: { organizationId: nextActiveOrg.id },
				headers: await authComponent.getHeaders(ctx)
			});

			// Update user's active organization in the database
			const user = await ctx.db.get(userId as Id<'users'>);
			if (user) {
				await ctx.db.patch(user._id, {
					activeOrganizationId: nextActiveOrg.id
				});
			}

			return true;
		} catch (error) {
			if (error instanceof ConvexError) {
				throw error;
			}

			if (error instanceof APIError) {
				switch (error.status) {
					case 400:
						throw new ConvexError('Invalid request data');
					case 401:
					case 403:
						throw new ConvexError('Unauthorized to leave organization');
					case 404:
						throw new ConvexError('Organization or member not found');
					default:
						throw new ConvexError(error.message || 'Failed to leave organization');
				}
			}

			throw new ConvexError('Failed to leave organization');
		}
	}
});
