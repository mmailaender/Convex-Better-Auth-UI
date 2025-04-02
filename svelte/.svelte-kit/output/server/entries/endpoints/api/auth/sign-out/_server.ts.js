import { s as signOut } from "../../../../../chunks/user.js";
const GET = async (event) => {
  const success = await signOut(event);
  if (success) {
    return new Response(null, { status: 200 });
  } else {
    return new Response("Sign-out failed", { status: 500 });
  }
};
export {
  GET
};
