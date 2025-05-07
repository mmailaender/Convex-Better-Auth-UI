import GitHub from "@auth/core/providers/github";
import { convexAuth } from "@convex-dev/auth/server";
import { internal } from "./_generated/api.js";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [GitHub],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, args) {
      const { userId } = args;
      const imageUrl = args.profile.image as string;

      const user = await ctx.db.get(userId);

      if (imageUrl && !user.imageId) {
        await ctx.scheduler.runAfter(
          0,
          internal.users.downloadAndStoreProfileImage,
          {
            userId,
            imageUrl,
          }
        );
      }
    },
  },
});
