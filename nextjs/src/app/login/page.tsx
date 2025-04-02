"use client";

import { useAuthActions } from "@convex-dev/auth/react";

export default function Login() {
  const { signIn } = useAuthActions();
  return (
    <button
      className="btn preset-filled-primary-500"
      onClick={() => void signIn("github")}
    >
      Sign in with GitHub
    </button>
  );
}
