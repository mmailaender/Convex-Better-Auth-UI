import { r as redirect } from "../../../chunks/index2.js";
import { s as sClient } from "../../../chunks/serverClient.js";
import { fql } from "fauna";
import { bigEndian } from "@oslojs/binary";
async function load(event) {
  if (event.locals.user !== null) {
    throw redirect(302, "/");
  }
  const userId = (await sClient.query(fql`newId()`)).data;
  const credentialUserId = new Uint8Array(8);
  bigEndian.putUint64(credentialUserId, BigInt(userId), 0);
  return {
    userId,
    credentialUserId
  };
}
export {
  load
};
