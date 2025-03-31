import { QueryCtx } from '../types';
import { WriteType } from './types';

/**
 * Gets the rules for the organizationMembers entity
 * Following the exact Convex Ents typing pattern from addEntRules
 */
export function getOrganizationMembersRules(ctx: QueryCtx) {
	return {
		write: async ({ operation, ent, value }: WriteType<'organizationMembers'>) => {
			if (operation === 'delete') {
				return true;
			}

			// Ensure only one membership per user per organization
			if (
				(operation === 'create' || operation === 'update') &&
				value.userId &&
				value.organizationId
			) {
				const existingMembers = await ctx.skipRules
					.table('organizationMembers')
					.filter((q) =>
						q.and(
							q.eq(q.field('userId'), value.userId),
							q.eq(q.field('organizationId'), value.organizationId)
						)
					);

				for (const existing of existingMembers) {
					if (operation === 'update' && ent._id === existing._id) {
						continue; // Skip the current membership during updates
					}
					throw new Error('User is already a member of this organization');
				}
			}

			return true;
		}
	};
}
