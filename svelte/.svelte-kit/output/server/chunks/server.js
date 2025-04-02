import { encodeHexLowerCase, encodeBase64, decodeBase64 } from "@oslojs/encoding";
import { s as sClient } from "./serverClient.js";
import { fql } from "fauna";
const challengeBucket = /* @__PURE__ */ new Set();
function createWebAuthnChallenge() {
  const challenge = new Uint8Array(20);
  crypto.getRandomValues(challenge);
  const encoded = encodeHexLowerCase(challenge);
  challengeBucket.add(encoded);
  return challenge;
}
function verifyWebAuthnChallenge(challenge) {
  const encoded = encodeHexLowerCase(challenge);
  console.log("Verifying WebAuthn challenge:", encoded);
  return challengeBucket.delete(encoded);
}
async function getPasskeyCredential(credentialId) {
  const response = await sClient.query(fql`getPasskeyCredential(${encodeBase64(credentialId)})`);
  if (response.data === null) {
    return null;
  }
  console.log("Fetched WebAuthn credential:", response.data);
  return {
    id: decodeBase64(response.data.id),
    userId: response.data.userId,
    algorithmId: response.data.algorithmId,
    publicKey: decodeBase64(response.data.publicKey)
  };
}
export {
  createWebAuthnChallenge as c,
  getPasskeyCredential as g,
  verifyWebAuthnChallenge as v
};
