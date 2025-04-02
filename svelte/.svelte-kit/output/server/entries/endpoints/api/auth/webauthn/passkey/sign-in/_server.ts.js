import { parseAuthenticatorData, parseClientDataJSON, ClientDataType, coseAlgorithmES256, createAssertionSignatureMessage, coseAlgorithmRS256 } from "@oslojs/webauthn";
import { decodePKIXECDSASignature, decodeSEC1PublicKey, p256, verifyECDSASignature } from "@oslojs/crypto/ecdsa";
import { ObjectParser } from "@pilcrowjs/object-parser";
import { decodeBase64, encodeBase64 } from "@oslojs/encoding";
import { v as verifyWebAuthnChallenge, g as getPasskeyCredential } from "../../../../../../../chunks/server.js";
import { sha256 } from "@oslojs/crypto/sha2";
import { decodePKCS1RSAPublicKey, verifyRSASSAPKCS1v15Signature, sha256ObjectIdentifier } from "@oslojs/crypto/rsa";
import { d as private_env } from "../../../../../../../chunks/shared-server.js";
import { s as setAccessTokenCookie, a as setRefreshTokenCookie } from "../../../../../../../chunks/index4.js";
import { b as signInWithPasskey } from "../../../../../../../chunks/user.server.js";
const allowedUrls = [];
if (private_env.VERCEL_URL) {
  allowedUrls.push(`https://${private_env.VERCEL_URL}`);
}
if (private_env.VERCEL_BRANCH_URL) {
  allowedUrls.push(`https://${private_env.VERCEL_BRANCH_URL}`);
}
if (private_env.CUSTOM_DOMAINS) {
  const customDomains = private_env.CUSTOM_DOMAINS.split(",").map(
    (domain) => "https://".concat(domain.trim())
  );
  allowedUrls.push(...customDomains);
}
async function POST(context) {
  console.log("POST request received for sign-in");
  const data = await context.request.json();
  const parser = new ObjectParser(data);
  let encodedAuthenticatorData;
  let encodedClientDataJSON;
  let encodedCredentialId;
  let encodedSignature;
  try {
    encodedAuthenticatorData = parser.getString("authenticator_data");
    encodedClientDataJSON = parser.getString("client_data_json");
    encodedCredentialId = parser.getString("credential_id");
    encodedSignature = parser.getString("signature");
    console.log("Parsed request payload successfully");
  } catch (error) {
    console.error("Invalid or missing fields in request payload:", error);
    return new Response("Invalid or missing fields", { status: 400 });
  }
  let authenticatorDataBytes;
  let clientDataJSON;
  let credentialId;
  let signatureBytes;
  try {
    authenticatorDataBytes = decodeBase64(encodedAuthenticatorData);
    clientDataJSON = decodeBase64(encodedClientDataJSON);
    credentialId = decodeBase64(encodedCredentialId);
    signatureBytes = decodeBase64(encodedSignature);
    console.log("Decoded request fields successfully");
  } catch (error) {
    console.error("Error decoding request fields:", error);
    return new Response("Invalid or missing fields", { status: 400 });
  }
  let authenticatorData;
  try {
    authenticatorData = parseAuthenticatorData(authenticatorDataBytes);
    console.log("Parsed authenticator data successfully");
  } catch (error) {
    console.error("Error parsing authenticator data:", error);
    return new Response("Invalid data", { status: 400 });
  }
  if (!allowedUrls.some((url) => authenticatorData.verifyRelyingPartyIdHash(new URL(url).hostname))) {
    console.error("Relying party ID hash verification failed");
    return new Response("Invalid data", { status: 400 });
  }
  if (!authenticatorData.userPresent || !authenticatorData.userVerified) {
    console.error("User not present or verified");
    return new Response("Invalid data", { status: 400 });
  }
  let clientData;
  try {
    clientData = parseClientDataJSON(clientDataJSON);
    console.log("Parsed client data JSON successfully");
  } catch (error) {
    console.error("Error parsing client data JSON:", error);
    return new Response("Invalid data", { status: 400 });
  }
  if (clientData.type !== ClientDataType.Get) {
    console.error("Invalid client data type:", clientData.type);
    return new Response("Invalid data", { status: 400 });
  }
  if (!verifyWebAuthnChallenge(clientData.challenge)) {
    console.error("WebAuthn challenge verification failed");
    return new Response("Invalid data", { status: 400 });
  }
  if (!allowedUrls.includes(clientData.origin)) {
    console.error("Client data origin not allowed:", clientData.origin);
    return new Response("Invalid data", { status: 400 });
  }
  if (clientData.crossOrigin !== null && clientData.crossOrigin) {
    console.error("Cross-origin requests are not allowed");
    return new Response("Invalid data", { status: 400 });
  }
  const credential = await getPasskeyCredential(credentialId);
  if (credential === null) {
    console.error("Credential not found");
    return new Response("Invalid credential", { status: 400 });
  }
  let validSignature;
  if (credential.algorithmId === coseAlgorithmES256) {
    const ecdsaSignature = decodePKIXECDSASignature(signatureBytes);
    const ecdsaPublicKey = decodeSEC1PublicKey(p256, credential.publicKey);
    const hash = sha256(createAssertionSignatureMessage(authenticatorDataBytes, clientDataJSON));
    validSignature = verifyECDSASignature(ecdsaPublicKey, hash, ecdsaSignature);
  } else if (credential.algorithmId === coseAlgorithmRS256) {
    const rsaPublicKey = decodePKCS1RSAPublicKey(credential.publicKey);
    const hash = sha256(createAssertionSignatureMessage(authenticatorDataBytes, clientDataJSON));
    validSignature = verifyRSASSAPKCS1v15Signature(
      rsaPublicKey,
      sha256ObjectIdentifier,
      hash,
      signatureBytes
    );
  } else {
    console.error("Unsupported credential algorithm");
    return new Response("Internal error", { status: 500 });
  }
  if (!validSignature) {
    console.error("Invalid signature");
    return new Response("Invalid signature", { status: 400 });
  }
  try {
    const { access, refresh } = await signInWithPasskey(encodeBase64(credential.id));
    console.log("Sign-in with passkey succeeded");
    setAccessTokenCookie(context, access.secret, access.ttl.toDate());
    setRefreshTokenCookie(context, refresh.secret, refresh.ttl.toDate());
  } catch (error) {
    console.error("Error during sign-in with passkey:", error);
    return new Response("Internal error", { status: 500 });
  }
  console.log("POST request for sign-in completed successfully");
  return new Response(null, { status: 204 });
}
export {
  POST
};
