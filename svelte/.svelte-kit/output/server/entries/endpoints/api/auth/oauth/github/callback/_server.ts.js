import { g as github } from "../../../../../../../chunks/oauth.js";
import { ObjectParser } from "@pilcrowjs/object-parser";
import { v as verifySocialAccountExists, s as signInWithSocialProvider, a as signUpWithSocialProvider } from "../../../../../../../chunks/user.server.js";
import { s as setAccessTokenCookie, a as setRefreshTokenCookie } from "../../../../../../../chunks/index4.js";
function splitFullName(fullName) {
  const trimmedName = fullName.trim();
  const normalizedName = trimmedName.replace(/\s+/g, " ");
  const nameParts = normalizedName.split(" ");
  let firstName = "";
  let lastName = "";
  if (nameParts.length === 0) {
    firstName = "";
    lastName = "";
  } else if (nameParts.length === 1) {
    firstName = nameParts[0];
    lastName = "";
  } else {
    lastName = nameParts[nameParts.length - 1];
    firstName = nameParts.slice(0, -1).join(" ");
  }
  return { firstName, lastName };
}
async function GET(event) {
  console.log("GitHub OAuth callback initiated");
  const storedState = event.cookies.get("github_oauth_state") ?? null;
  const code = event.url.searchParams.get("code");
  const state = event.url.searchParams.get("state");
  if (storedState === null || code === null || state === null || storedState !== state) {
    console.warn("State validation failed or missing parameters");
    const errorMessage = encodeURIComponent("Please restart the process.");
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/sign-in?error=${errorMessage}`
      }
    });
  }
  let tokens;
  try {
    console.log("Validating authorization code with GitHub");
    tokens = await github.validateAuthorizationCode(code);
  } catch (error) {
    console.error("Error validating authorization code:", error);
    const errorMessage = encodeURIComponent("Please restart the process.");
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/sign-in?error=${errorMessage}`
      }
    });
  }
  const githubAccessToken = tokens.accessToken();
  console.log("Fetching GitHub user information");
  const userRequest = new Request("https://api.github.com/user");
  userRequest.headers.set("Authorization", `Bearer ${githubAccessToken}`);
  const userResponse = await fetch(userRequest);
  const userResult = await userResponse.json();
  const userParser = new ObjectParser(userResult);
  const githubUserId = userParser.getNumber("id").toString();
  const username = userParser.getString("login");
  const fullName = userParser.getString("name");
  const { firstName, lastName } = splitFullName(fullName);
  console.log("GitHub user information fetched:", { githubUserId, username, firstName, lastName });
  console.log("Checking if the GitHub user already exists");
  const userExists = await verifySocialAccountExists("Github", githubUserId);
  if (userExists) {
    console.log("User exists, signing in");
    const { access, refresh } = await signInWithSocialProvider("Github", githubUserId);
    setAccessTokenCookie(event, access.secret, access.ttl.toDate());
    setRefreshTokenCookie(event, refresh.secret, refresh.ttl.toDate());
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/"
      }
    });
  }
  console.log("Fetching verified email address from GitHub");
  const emailListRequest = new Request("https://api.github.com/user/emails");
  emailListRequest.headers.set("Authorization", `Bearer ${githubAccessToken}`);
  const emailListResponse = await fetch(emailListRequest);
  const emailListResult = await emailListResponse.json();
  if (!Array.isArray(emailListResult) || emailListResult.length < 1) {
    console.warn("No verified email addresses found");
    const errorMessage = encodeURIComponent("Please restart the process.");
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/sign-in?error=${errorMessage}`
      }
    });
  }
  let email = null;
  for (const emailRecord of emailListResult) {
    const emailParser = new ObjectParser(emailRecord);
    if (emailParser.getBoolean("primary") && emailParser.getBoolean("verified")) {
      email = emailParser.getString("email");
      break;
    }
  }
  if (email === null) {
    console.warn("No primary verified email address found");
    const errorMessage = encodeURIComponent("Please verify your GitHub email address.");
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/sign-in?error=${errorMessage}`
      }
    });
  }
  try {
    console.log("Creating new user with GitHub account");
    const { access, refresh } = await signUpWithSocialProvider(firstName || username, lastName || "", email, githubUserId, email);
    setAccessTokenCookie(event, access.secret, access.ttl.toDate());
    setRefreshTokenCookie(event, refresh.secret, refresh.ttl.toDate());
  } catch (error) {
    console.error("Error during user sign-up:", error);
    const errorMessage = encodeURIComponent("User with this email already exists. Please sign in with your initial used account.");
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/sign-in?error=${errorMessage}`
      }
    });
  }
  console.log("GitHub OAuth process completed successfully");
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/"
    }
  });
}
export {
  GET
};
