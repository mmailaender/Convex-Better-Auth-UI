import { QueryCtx } from '../types';
import { WriteType } from './types';

/**
 * Gets the rules for the verification entity
 * Following the exact Convex Ents typing pattern from addEntRules
 */
export function getVerificationRules(ctx: QueryCtx) {
	return {
		write: async ({ operation, ent, value }: WriteType<'verifications'>) => {
			if (operation === 'delete') {
				return true;
			}

			// Email validation check
			// Check: isEmail
			if ((operation === 'create' || (operation === 'update' && value.email)) && value.email) {
				const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
				if (!emailRegex.test(value.email)) {
					throw new Error('Invalid email format');
				}
			}

			// Check: isNotVerified - ensures that no verification will be started for an already verified email
			if (operation === 'create' && value.email) {
				const allUsers = await ctx.skipRules.table('users');
				for (const user of allUsers) {
					if (user.emails.includes(value.email)) {
						throw new Error('Cannot create verification for an already verified email');
					}
				}
			}

			// Check unique [.email] - A verification must exist only once for an email
			if (operation === 'create' && value.email) {
				const existingVerifications = await ctx.skipRules.table('verifications', 'email', (q) =>
					q.eq('email', value.email)
				);

				if (existingVerifications.length > 0) {
					throw new Error('A verification already exists for this email');
				}
			}

			return true;
		}
	};
}
