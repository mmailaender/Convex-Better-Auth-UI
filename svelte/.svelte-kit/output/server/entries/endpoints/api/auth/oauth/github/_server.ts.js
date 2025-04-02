import { g as github } from "../../../../../../chunks/oauth.js";
import { generateState } from "arctic";
function GET(event) {
  const state = generateState();
  const url = github.createAuthorizationURL(state, ["user:email"]);
  event.cookies.set("github_oauth_state", state, {
    httpOnly: true,
    maxAge: 60 * 10,
    secure: true,
    path: "/",
    sameSite: "lax"
  });
  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString()
    }
  });
}
export {
  GET
};
