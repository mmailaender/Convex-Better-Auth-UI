import { QueryCtx } from '../types';
import { WriteType } from './types';

/**
 * Gets the rules for the invitation entity
 * Following the exact Convex Ents typing pattern from addEntRules
 */
export function getInvitationRules(ctx: QueryCtx) {
	return {
		write: async ({ operation, ent, value }: WriteType<'invitations'>) => {
			if (operation === 'delete') {
				return true;
			}

			// Ensure only one active invitation per email per organization
			// Check: unique [.organization, .email]
			if (
				(operation === 'create' || operation === 'update') &&
				value.email &&
				value.organizationId
			) {
				const existingInvitations = await ctx.skipRules
					.table('invitations')
					.filter((q) =>
						q.and(
							q.eq(q.field('email'), value.email),
							q.eq(q.field('organizationId'), value.organizationId)
						)
					);

				for (const existing of existingInvitations) {
					if (operation === 'update' && ent._id === existing._id) {
						continue; // Skip the current invitation during updates
					}
					throw new Error('An invitation already exists for this email in this organization');
				}
			}

			// Email validation check
			// Check: isEmail
			if ((operation === 'create' || (operation === 'update' && value.email)) && value.email) {
				const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
				if (!emailRegex.test(value.email)) {
					throw new Error('Invalid email format');
				}
			}

			return true;
		}
	};
}
