import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";
import { api, internal } from "../../_generated/api";
import {
  sendOrganizationInvitationEmail,
  verifyEmail,
} from "../../emails/actions";

/**
 * Creates an invitation and sends an invitation email
 */
export const inviteMember = action({
  args: {
    email: v.string(),
    role: v.union(
      v.literal("role_organization_member"),
      v.literal("role_organization_admin"),
      v.literal("role_organization_owner")
    ),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ _id: Id<"invitations">; email: string; role: string }> => {
    const { email, role } = args;

    // Get the authenticated user
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    // Get the user's active organization
    const user = await ctx.runQuery(api.users.getUser, {});
    if (!user || !user.activeOrganizationId) {
      throw new Error("User has no active organization");
    }

    const organizationId = user.activeOrganizationId;

    // Check if the user is authorized to send invitations
    const isAuthorized = await ctx.runQuery(
      api.organizations.members.isOwnerOrAdmin,
      {
        organizationId,
      }
    );
    if (!isAuthorized) {
      throw new Error("Not authorized to send invitations");
    }

    // Verify the email address
    const verificationResult = await verifyEmail(ctx, email);

    if (!verificationResult.valid) {
      throw new Error(
        `Email ${email} is not valid: ${verificationResult.reason}`
      );
    }

    const invitation = await ctx.runMutation(
      internal.organizations.invitations.db.createInvitation,
      {
        email,
        role,
      }
    );

    if (!invitation) {
      throw new Error("Failed to create invitation");
    }

    const baseUrl = process.env.SITE_URL;
    const fromEmail = process.env.EMAIL_SEND_FROM;

    if (!baseUrl || !fromEmail) {
      throw new Error("Missing environment variables");
    }

    // Generate the acceptance URL
    const acceptUrl = `${baseUrl}/api/invitations/accept?invitationId=${invitation._id}`;

    // Send the invitation email
    const emailResult = await sendOrganizationInvitationEmail({
      email,
      organizationName: invitation.organizationName,
      inviterName: invitation.invitedByName,
      acceptUrl,
      fromEmail,
    });

    if (emailResult.error) {
      // If email fails, we still return the invitation but log the error
      console.error(
        `Error sending invitation email to ${email}:`,
        emailResult.error
      );
    }

    return {
      _id: invitation._id,
      email,
      role,
    };
  },
});
