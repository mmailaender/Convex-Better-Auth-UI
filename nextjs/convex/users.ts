import { getAuthUserId, invalidateSessions } from "@convex-dev/auth/server";
import { v } from "convex/values";
import {
  action,
  internalAction,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api.js";

export const isUserExisting = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const { email } = args;
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), email))
      .first();
    return user !== null;
  },
});

export const getUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    user.image = user.imageId
      ? ((await ctx.storage.getUrl(user.imageId)) ?? undefined)
      : undefined;
    return user;
  },
});

export const updateUserName = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.patch(userId, {
      name: args.name,
    });
  },
});

export const updateAvatar = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Update the user's avatar
    return await ctx.db.patch(userId, {
      imageId: args.storageId,
    });
  },
});

export const downloadAndStoreProfileImage = internalAction({
  args: {
    userId: v.id("users"),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, imageUrl } = args;

    // Download the image
    const response = await fetch(imageUrl);
    const image = await response.blob();

    // Store the image in Convex
    const postUrl = await ctx.storage.generateUploadUrl();

    const { storageId } = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": image.type },
      body: image,
    }).then((res) => res.json());
    await ctx.runMutation(internal.users.updateUser, {
      userId,
      data: {
        imageId: storageId,
        image: null,
      },
    });
  },
});

export const updateUser = internalMutation({
  args: {
    userId: v.id("users"),
    data: v.record(v.string(), v.any()),
  },
  handler: async (ctx, args) => {
    const { userId, data } = args;

    // Convert null values to undefined
    const patchData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value === null ? undefined : value,
      ])
    );
    return await ctx.db.patch(userId, patchData);
  },
});

export const deleteUser = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { userId } = args;

    const authAccounts = await ctx.db
      .query("authAccounts")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    for (const account of authAccounts) {
      await ctx.db.delete(account._id);
    }

    const user = await ctx.db.get(userId);
    // Delete image from storage
    if (user?.imageId) {
      await ctx.storage.delete(user.imageId);
    }

    return await ctx.db.delete(userId);
  },
});

export const invalidateAndDeleteUser = action({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    try {
      await ctx.runMutation(internal.users.deleteUser, { userId });
      await invalidateSessions(ctx, { userId });
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  },
});
