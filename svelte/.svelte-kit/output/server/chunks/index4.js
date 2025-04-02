import { Client, fql } from "fauna";
const uClient = (secret) => {
  return new Client({
    secret
    // TODO: Add user accessToken
  });
};
async function invalidateSession(secret) {
  await uClient(secret).query(fql`signOut()`);
}
function setAccessTokenCookie(event, token, expiresAt) {
  event.cookies.set("access_token", token, {
    httpOnly: true,
    sameSite: "lax",
    expires: expiresAt,
    path: "/"
  });
}
function setRefreshTokenCookie(event, token, expiresAt) {
  event.cookies.set("refresh_token", token, {
    httpOnly: true,
    sameSite: "strict",
    expires: expiresAt,
    path: "/"
  });
}
function deleteAccessTokenCookie(event) {
  event.cookies.delete("access_token", {
    path: "/"
  });
}
function deleteRefreshTokenCookie(event) {
  event.cookies.delete("refresh_token", {
    path: "/"
  });
}
async function refreshAccessToken(refreshToken) {
  const response = await uClient(refreshToken).query(fql`refreshAccessToken()`);
  return response.data;
}
export {
  setRefreshTokenCookie as a,
  deleteRefreshTokenCookie as b,
  deleteAccessTokenCookie as d,
  invalidateSession as i,
  refreshAccessToken as r,
  setAccessTokenCookie as s,
  uClient as u
};
