import { GitHub } from "arctic";
import { G as GITHUB_CLIENT_ID, a as GITHUB_CLIENT_SECRET } from "./private.js";
const github = new GitHub(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, "https://localhost:5173/api/auth/oauth/github/callback");
export {
  github as g
};
