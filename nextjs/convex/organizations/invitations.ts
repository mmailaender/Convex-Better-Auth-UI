import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Get pending invitations for the current active organization
 */
export const getOrganizationInvitations = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get the user's active organization
    const user = await ctx.db.get(userId);
    if (!user || !user.activeOrganizationId) {
      return [];
    }

    const organizationId: Id<"organizations"> = user.activeOrganizationId;

    // Check if the user is an admin or owner
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("orgId_and_userId", (q) =>
        q.eq("organizationId", organizationId).eq("userId", userId)
      )
      .first();

    if (
      !membership ||
      !["role_organization_owner", "role_organization_admin"].includes(
        membership.role
      )
    ) {
      // Not authorized to view invitations
      return [];
    }

    // Get all invitations for this organization
    const invitations = await ctx.db
      .query("invitations")
      .withIndex("by_org_and_email", (q) =>
        q.eq("organizationId", organizationId)
      )
      .collect();

    // Get the invited by user info for each invitation
    return await Promise.all(
      invitations.map(async (invitation) => {
        const invitedByUser = await ctx.db.get(invitation.invitedByUserId);

        return {
          _id: invitation._id,
          email: invitation.email,
          role: invitation.role,
          invitedBy: {
            _id: invitedByUser?._id,
            name: invitedByUser?.name || "Unknown",
          },
          expiresAt: invitation.expiresAt,
        };
      })
    );
  },
});

/**
 * Revokes an invitation
 */
export const revokeInvitation = mutation({
  args: {
    invitationId: v.id("invitations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get the invitation
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) {
      throw new Error("Invitation not found");
    }

    // Check if the user is an admin or owner of this organization
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("orgId_and_userId", (q) =>
        q.eq("organizationId", invitation.organizationId).eq("userId", userId)
      )
      .first();

    if (
      !membership ||
      !["role_organization_owner", "role_organization_admin"].includes(
        membership.role
      )
    ) {
      throw new Error("Not authorized to revoke invitations");
    }

    // Delete the invitation
    await ctx.db.delete(args.invitationId);
    return { success: true };
  },
});

/**
 * Invite a new member to the organization
 */
export const inviteMember = mutation({
  args: {
    email: v.string(),
    role: v.union(
      v.literal("role_organization_member"),
      v.literal("role_organization_admin"),
      v.literal("role_organization_owner")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get the user's active organization
    const user = await ctx.db.get(userId);
    if (!user || !user.activeOrganizationId) {
      throw new Error("No active organization");
    }

    const organizationId: Id<"organizations"> = user.activeOrganizationId;

    // Check if the user is an admin or owner
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("orgId_and_userId", (q) =>
        q.eq("organizationId", organizationId).eq("userId", userId)
      )
      .first();

    if (
      !membership ||
      !["role_organization_owner", "role_organization_admin"].includes(
        membership.role
      )
    ) {
      throw new Error("Not authorized to invite members");
    }

    // Check if there's already an invitation for this email
    const existingInvitation = await ctx.db
      .query("invitations")
      .withIndex("by_org_and_email", (q) =>
        q.eq("organizationId", organizationId).eq("email", args.email)
      )
      .first();

    if (existingInvitation) {
      throw new Error("Invitation already exists for this email");
    }

    // Check if the user is already a member
    const existingMember = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (existingMember) {
      const existingMembership = await ctx.db
        .query("organizationMembers")
        .withIndex("orgId_and_userId", (q) =>
          q
            .eq("organizationId", organizationId)
            .eq("userId", existingMember._id)
        )
        .first();

      if (existingMembership) {
        throw new Error("User is already a member of this organization");
      }
    }

    // Create the invitation (valid for 7 days)
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const invitationId = await ctx.db.insert("invitations", {
      organizationId,
      invitedByUserId: userId,
      email: args.email,
      role: args.role,
      expiresAt,
    });

    // In a real app, you would send an email to the invited user here

    return invitationId;
  },
});
