import { c as createWebAuthnChallenge } from "../../../../../../chunks/server.js";
import { encodeBase64 } from "@oslojs/encoding";
import { R as RefillingTokenBucket } from "../../../../../../chunks/rate-limit.js";
const webauthnChallengeRateLimitBucket = new RefillingTokenBucket(30, 10);
async function POST(event) {
  const clientIP = event.request.headers.get("X-Forwarded-For");
  if (clientIP !== null && !webauthnChallengeRateLimitBucket.consume(clientIP, 1)) {
    return new Response("Too many requests", {
      status: 429
    });
  }
  const challenge = createWebAuthnChallenge();
  return new Response(JSON.stringify({ challenge: encodeBase64(challenge) }));
}
export {
  POST
};
