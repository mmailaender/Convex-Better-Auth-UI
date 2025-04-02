import { Client } from "fauna";
import { F as FAUNA_SIGNIN_KEY } from "./private.js";
const sClient = new Client({
  secret: FAUNA_SIGNIN_KEY
});
export {
  sClient as s
};
