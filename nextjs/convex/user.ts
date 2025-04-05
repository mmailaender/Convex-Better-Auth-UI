import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api.js";

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

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Generate a URL for the client to upload an image directly to storage
    return await ctx.storage.generateUploadUrl();
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
    await ctx.runMutation(internal.user.updateUser, {
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
