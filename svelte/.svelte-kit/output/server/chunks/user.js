import { i as invalidateSession, d as deleteAccessTokenCookie, b as deleteRefreshTokenCookie, u as uClient } from "./index4.js";
import { fql } from "fauna";
async function getUser(accessToken) {
  const response = await uClient(accessToken).query(fql`Query.identity()`);
  return response.data;
}
async function signOut(event) {
  const accessToken = event.cookies.get("access_token");
  if (accessToken) {
    try {
      await invalidateSession(accessToken);
      deleteAccessTokenCookie(event);
      deleteRefreshTokenCookie(event);
      return true;
    } catch (error) {
      console.error("Failed to sign out:", error);
      return false;
    }
  }
  return false;
}
async function updateUser(accessToken, user) {
  const response = await uClient(accessToken).query(
    fql`Query.identity()!.update({${user}})`
  );
  return response.data;
}
async function addEmail(accessToken, email, verificationOTP) {
  try {
    const response = await uClient(accessToken).query(
      fql`addEmail(${email}, ${verificationOTP})`
    );
    return response.data;
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message);
    }
    throw new Error("Error updating email.");
  }
}
async function getUserAndAccounts(accessToken) {
  const response = await uClient(accessToken).query(
    fql`Query.identity() {
			id,
			coll,
			firstName,
			lastName,
			primaryEmail,
			emailVerification,
			emails,
			accounts
		  }`
  );
  return response.data;
}
export {
  addEmail as a,
  getUser as b,
  getUserAndAccounts as g,
  signOut as s,
  updateUser as u
};
