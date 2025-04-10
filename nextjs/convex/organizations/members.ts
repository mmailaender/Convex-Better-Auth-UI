import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Get all members of the current active organization
 */
export const getOrganizationMembers = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get user to find active organization
    const user = await ctx.db.get(userId);
    if (!user || !user.activeOrganizationId) {
      return [];
    }

    const organizationId = user.activeOrganizationId;

    // Get all members of the active organization
    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("orgId", (q) => q.eq("organizationId", organizationId))
      .collect();

    // Get detailed info for each member
    const membersWithDetails = await Promise.all(
      memberships.map(async (membership) => {
        const memberUser = await ctx.db.get(membership.userId);
        // Skip members whose user record doesn't exist
        if (!memberUser) {
          return undefined;
        }

        if (memberUser.imageId) {
          memberUser.image =
            (await ctx.storage.getUrl(memberUser.imageId)) || undefined;
        }

        return {
          _id: membership._id,
          user: {
            id: memberUser._id,
            name: memberUser.name,
            email: memberUser.email,
            image: memberUser.image,
          },
          role: membership.role,
        };
      })
    );

    // Filter out null values and return
    return membersWithDetails.filter((member) => member !== undefined);
  },
});

/**
 * Check if the current user is an admin or owner of the specified organization
 */
export const isOwnerOrAdmin = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return false;
    }

    // Get the membership
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("orgId_and_userId", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", userId)
      )
      .first();

    return (
      !!membership &&
      ["role_organization_owner", "role_organization_admin"].includes(
        membership.role
      )
    );
  },
});

/**
 * Update the role of a member in the current active organization
 */
export const updateMemberRole = mutation({
  args: {
    userId: v.id("users"),
    newRole: v.union(
      v.literal("role_organization_member"),
      v.literal("role_organization_admin")
    ),
  },
  handler: async (ctx, args) => {
    const actorId = await getAuthUserId(ctx);
    if (!actorId) {
      throw new Error("Not authenticated");
    }

    // Get user to find active organization
    const actor = await ctx.db.get(actorId);
    if (!actor || !actor.activeOrganizationId) {
      throw new Error("No active organization");
    }

    const organizationId = actor.activeOrganizationId;

    // Check if the actor has permission (admin or owner)
    const actorMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("orgId_and_userId", (q) =>
        q.eq("organizationId", organizationId).eq("userId", actorId)
      )
      .first();

    if (!actorMembership) {
      throw new Error("Not a member of this organization");
    }

    if (
      !["role_organization_owner", "role_organization_admin"].includes(
        actorMembership.role
      )
    ) {
      throw new Error("Insufficient permissions to update member roles");
    }

    // Find the target user's membership
    const targetMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("orgId_and_userId", (q) =>
        q.eq("organizationId", organizationId).eq("userId", args.userId)
      )
      .first();

    if (!targetMembership) {
      throw new Error("Target user is not a member of this organization");
    }

    if (targetMembership.role === "role_organization_owner") {
      throw new Error("Cannot change the role of an organization owner");
    }

    // Update the membership
    await ctx.db.patch(targetMembership._id, {
      role: args.newRole,
    });

    return true;
  },
});

/**
 * Remove a user from the current active organization
 */
export const removeMember = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const actorId = await getAuthUserId(ctx);
    if (!actorId) {
      throw new Error("Not authenticated");
    }

    // Get user to find active organization
    const actor = await ctx.db.get(actorId);
    if (!actor || !actor.activeOrganizationId) {
      throw new Error("No active organization");
    }

    const organizationId = actor.activeOrganizationId;

    // Check if the actor has permission (admin or owner)
    const actorMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("orgId_and_userId", (q) =>
        q.eq("organizationId", organizationId).eq("userId", actorId)
      )
      .first();

    if (!actorMembership) {
      throw new Error("Not a member of this organization");
    }

    if (
      !["role_organization_owner", "role_organization_admin"].includes(
        actorMembership.role
      )
    ) {
      throw new Error("Insufficient permissions to remove members");
    }

    // Find the target user's membership
    const targetMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("orgId_and_userId", (q) =>
        q.eq("organizationId", organizationId).eq("userId", args.userId)
      )
      .first();

    if (!targetMembership) {
      throw new Error("Target user is not a member of this organization");
    }

    // Cannot remove the organization owner
    if (targetMembership.role === "role_organization_owner") {
      throw new Error("Cannot remove an organization owner");
    }

    // Remove the membership
    await ctx.db.delete(targetMembership._id);

    return true;
  },
});
