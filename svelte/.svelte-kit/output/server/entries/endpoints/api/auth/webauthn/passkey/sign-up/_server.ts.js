import { parseAttestationObject, AttestationStatementFormat, parseClientDataJSON, ClientDataType, coseAlgorithmES256, coseEllipticCurveP256, coseAlgorithmRS256 } from "@oslojs/webauthn";
import { ECDSAPublicKey, p256 } from "@oslojs/crypto/ecdsa";
import { decodeBase64 } from "@oslojs/encoding";
import { v as verifyWebAuthnChallenge } from "../../../../../../../chunks/server.js";
import { RSAPublicKey } from "@oslojs/crypto/rsa";
import { d as private_env } from "../../../../../../../chunks/shared-server.js";
import { c as signUpWithPasskey } from "../../../../../../../chunks/user.server.js";
import { s as setAccessTokenCookie, a as setRefreshTokenCookie } from "../../../../../../../chunks/index4.js";
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
async function POST(event) {
  console.log("POST request received");
  const {
    firstName,
    lastName,
    email,
    otp,
    userId,
    encodedAttestationObject,
    encodedClientDataJSON
  } = await event.request.json();
  console.log("Request payload:", { firstName, lastName, email, userId });
  if (typeof firstName !== "string" || typeof lastName !== "string" || typeof email !== "string" || typeof otp !== "string" || typeof userId !== "string" || typeof encodedAttestationObject !== "string" || typeof encodedClientDataJSON !== "string") {
    console.error("Invalid or missing fields");
    return new Response("Invalid or missing fields", { status: 400 });
  }
  let attestationObjectBytes, clientDataJSON;
  try {
    attestationObjectBytes = decodeBase64(encodedAttestationObject);
    clientDataJSON = decodeBase64(encodedClientDataJSON);
  } catch (error) {
    console.error("Error decoding attestation or client data JSON:", error);
    return new Response("Invalid or missing fields", { status: 400 });
  }
  let attestationStatement, authenticatorData;
  try {
    const attestationObject = parseAttestationObject(attestationObjectBytes);
    attestationStatement = attestationObject.attestationStatement;
    authenticatorData = attestationObject.authenticatorData;
    console.log("Parsed attestation object successfully");
  } catch (error) {
    console.error("Error parsing attestation object:", error);
    return new Response("Invalid data", { status: 400 });
  }
  if (attestationStatement.format !== AttestationStatementFormat.None) {
    console.error("Invalid attestation format");
    return new Response("Invalid data", { status: 400 });
  }
  if (!allowedUrls.some((url) => authenticatorData.verifyRelyingPartyIdHash(new URL(url).hostname))) {
    console.error("Relying party ID hash verification failed");
    return new Response("Invalid data", { status: 400 });
  }
  if (!authenticatorData.userPresent || !authenticatorData.userVerified) {
    console.error("User not present or not verified");
    return new Response("Invalid data", { status: 400 });
  }
  if (authenticatorData.credential === null) {
    console.error("Authenticator data credential is null");
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
  if (clientData.type !== ClientDataType.Create) {
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
  let credential;
  if (authenticatorData.credential.publicKey.algorithm() === coseAlgorithmES256) {
    let cosePublicKey;
    try {
      cosePublicKey = authenticatorData.credential.publicKey.ec2();
      console.log("Parsed EC2 public key successfully");
    } catch (error) {
      console.error("Error parsing EC2 public key:", error);
      return new Response("Invalid data", { status: 400 });
    }
    if (cosePublicKey.curve !== coseEllipticCurveP256) {
      console.error("Unsupported EC2 curve:", cosePublicKey.curve);
      return new Response("Unsupported algorithm", { status: 400 });
    }
    const encodedPublicKey = new ECDSAPublicKey(
      p256,
      cosePublicKey.x,
      cosePublicKey.y
    ).encodeSEC1Uncompressed();
    credential = {
      id: authenticatorData.credential.id,
      userId,
      algorithmId: coseAlgorithmES256,
      publicKey: encodedPublicKey,
      otp
    };
  } else if (authenticatorData.credential.publicKey.algorithm() === coseAlgorithmRS256) {
    let cosePublicKey;
    try {
      cosePublicKey = authenticatorData.credential.publicKey.rsa();
      console.log("Parsed RSA public key successfully");
    } catch (error) {
      console.error("Error parsing RSA public key:", error);
      return new Response("Invalid data", { status: 400 });
    }
    const encodedPublicKey = new RSAPublicKey(cosePublicKey.n, cosePublicKey.e).encodePKCS1();
    credential = {
      id: authenticatorData.credential.id,
      userId,
      algorithmId: coseAlgorithmRS256,
      publicKey: encodedPublicKey,
      otp
    };
  } else {
    console.error("Unsupported public key algorithm");
    return new Response("Unsupported algorithm", { status: 400 });
  }
  try {
    const { access, refresh } = await signUpWithPasskey(credential, firstName, lastName, email);
    console.log("Sign-up with passkey succeeded");
    setAccessTokenCookie(event, access.secret, access.ttl.toDate());
    setRefreshTokenCookie(event, refresh.secret, refresh.ttl.toDate());
  } catch (error) {
    console.error("Error during sign-up with passkey:", error);
    return new Response("Invalid data", { status: 400 });
  }
  console.log("POST request completed successfully");
  return new Response(null, { status: 204 });
}
export {
  POST
};
