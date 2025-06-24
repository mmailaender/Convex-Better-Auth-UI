import { v } from 'convex/values';
import { action } from '../_generated/server';

import { sendOrganizationInvitationEmailModel, sendVerificationEmailModel } from '../model/emails';

/**
 * Action to send a verification email with OTP
 */
export const sendVerificationEmail = action({
	args: {
		from: v.string(),
		to: v.string(),
		otp: v.string()
	},
	handler: async (ctx, args) => {
		return sendVerificationEmailModel(ctx, args);
	}
});

export const sendOrganizationInvitationEmail = action({
	args: {
		from: v.string(),
		to: v.string(),
		organizationName: v.string(),
		inviterName: v.string(),
		acceptUrl: v.string()
	},
	handler: async (ctx, args) => {
		return sendOrganizationInvitationEmailModel(ctx, args);
	}
});
