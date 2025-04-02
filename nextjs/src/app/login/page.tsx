import { useAuthActions } from "@convex-dev/auth/react";

export default function Login() {
  const { signIn } = useAuthActions();
  return (
    <button onClick={() => void signIn("github")}>Sign in with GitHub</button>
  );
}
