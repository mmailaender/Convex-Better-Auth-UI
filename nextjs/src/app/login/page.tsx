"use client";

import { useAuthActions } from "@convex-dev/auth/react";

export default function Login() {
  const { signIn } = useAuthActions();
  return (
    <div className="flex flex-col min-[460px]:flex-row w-full gap-2 items-stretch">
      <button
        className="btn preset-filled-primary-500"
        onClick={() => void signIn("github")}
      >
        Sign in with GitHub
      </button>
    </div>
  );
}
