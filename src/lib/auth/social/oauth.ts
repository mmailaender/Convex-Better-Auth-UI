import { GitHub } from "arctic";
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from "$env/static/private";

// TODO: Update redirect URI
export const github = new GitHub(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, "https://localhost:5173/api/auth/oauth/github/callback");