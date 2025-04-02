import { addEntRules } from 'convex-ents';
import { entDefinitions } from './schema';
import { QueryCtx } from './types';
import { Id } from './_generated/dataModel';

import { getUserRules } from './rules/users';
import { getAccountRules } from './rules/accounts';
import { getInvitationRules } from './rules/invitations';
import { getVerificationRules } from './rules/verifications';
import { getOrganizationMembersRules } from './rules/organizationMembers';

export function getEntDefinitionsWithRules(ctx: QueryCtx): typeof entDefinitions {
	return addEntRules(entDefinitions, {
		// User rules and constraints
		users: getUserRules(ctx),

		// Account unique constraints
		accounts: getAccountRules(ctx),

		// Invitation unique constraints and checks
		invitations: getInvitationRules(ctx),

		// Verification constraints
		verifications: getVerificationRules(ctx),

		// Organization member uniqueness
		organizationMembers: getOrganizationMembersRules(ctx)
	});
}

// Retrieve viewer ID using ctx.auth
export async function getViewerId(
	ctx: Omit<QueryCtx, 'table' | 'viewerId' | 'viewer' | 'viewerX'>
): Promise<Id<'users'> | null> {
	const user = await ctx.auth.getUserIdentity();
	if (user === null) {
		return null;
	}
	const viewer = await ctx.skipRules.table('users').get(user.subject as Id<'users'>);
	return viewer?._id ?? null;
}
