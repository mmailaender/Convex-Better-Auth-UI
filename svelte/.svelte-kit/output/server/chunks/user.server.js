import { s as sClient } from "./serverClient.js";
import { fql } from "fauna";
import { encodeBase64 } from "@oslojs/encoding";
async function signUpWithSocialProvider(firstName, lastName, email, providerUserId, providerUserEmail) {
  const response = await sClient.query(
    fql`signUpWithSocialProvider({ firstName: ${firstName}, lastName: ${lastName}, email: ${email}, providerUserId: ${providerUserId}, providerName: "Github", providerEmail: ${providerUserEmail} })`
  );
  return response.data;
}
async function signUpWithPasskey(credential, firstName, lastName, email) {
  const query = fql`signUpWithPasskey({ id: ${encodeBase64(credential.id)}, userId: ${credential.userId}, algorithmId: ${credential.algorithmId}, publicKey: ${encodeBase64(credential.publicKey)}, otp: ${credential.otp}}, { firstName: ${firstName}, lastName: ${lastName}, email: ${email} })`;
  const response = await sClient.query(query);
  return response.data;
}
async function signInWithSocialProvider(providerName, providerUserId) {
  const response = await sClient.query(
    fql`signInWithSocialProvider(${providerName}, ${providerUserId})`
  );
  return response.data;
}
async function signInWithPasskey(passkeyId) {
  const response = await sClient.query(fql`signInWithPasskey(${passkeyId})`);
  return response.data;
}
async function verifyUserExists(email) {
  const response = await sClient.query(fql`verifyUserExists(${email})`);
  return response.data;
}
async function verifySocialAccountExists(provider, providerAccountId) {
  const response = await sClient.query(
    fql`verifySocialAccountExists(${provider}, ${providerAccountId})`
  );
  return response.data;
}
async function createVerification(email, userId) {
  console.log(`Creating email verification for: ${email} with userId: ${userId}`);
  const res = await sClient.query(
    fql`createVerification({email: ${email}, userId: ${userId ? userId : null}})`
  );
  return res.data;
}
async function createEmailVerification(accessToken, email, fetch, userId) {
  if (!accessToken) {
    console.warn("Access token is missing");
    return false;
  }
  try {
    console.log(`Verifying email: ${email}`);
    const res = await fetch(
      `/api/auth/webauthn/verify-email?email=${encodeURIComponent(email)}&userId=${userId}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      }
    );
    if (!res.ok) {
      const errorMessage = await res.text();
      console.error("Failed to verify email:", errorMessage);
      throw new Error(errorMessage);
    }
    const { exists } = await res.json();
    console.log(`Email ${email} successfuly verified: ${exists}`);
    return exists;
  } catch (err) {
    console.error("Error creating email verification:", err);
    if (err instanceof Error) {
      throw new Error(err.message);
    }
    throw new Error("Error creating email verification.");
  }
}
export {
  signUpWithSocialProvider as a,
  signInWithPasskey as b,
  signUpWithPasskey as c,
  verifyUserExists as d,
  createVerification as e,
  createEmailVerification as f,
  signInWithSocialProvider as s,
  verifySocialAccountExists as v
};
