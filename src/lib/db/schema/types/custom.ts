import { type TimeStub, type DateStub } from "fauna";
import { v } from "./system";

import { scope, type } from "arktype";

const types = scope({
  user: [v.document.read, "&", {
  firstName: "string",
  lastName: "string",
  primaryEmail: "string",
  emails: "string[]",
  "avatar?": "string",
  accounts: "account[]",
  "emailVerification?": "string",
}],
  account: [v.document.read, "&", {
  user: "user",
  "socialProvider?": { name: "'Github' | 'Google' | 'Facebook'", userId: "string", email: "string" },
  "passkey?": { publicKey: "string", algorithmId: "number", id: "string" },
  "_socialProviderName?": "string",
  "_passkeyId?": "string",
}],
  verification: [v.document.read, "&", {
  email: "string",
  otp: "string",
  "user?": "user",
}],
}).export();

const types_create = scope({
  user: [v.document.create, "&", {
  firstName: "string",
  lastName: "string",
  primaryEmail: "string",
  emails: "string[]",
  "avatar?": "string",
  accounts: v.createRef(type("'Account'")).array(),
}],
  account: [v.document.create, "&", {
  user: v.createRef(type("'User'")),
  "socialProvider?": { name: "'Github' | 'Google' | 'Facebook'", userId: "string", email: "string" },
  "passkey?": { publicKey: "string", algorithmId: "number", id: "string" },
}],
  verification: [v.document.create, "&", {
  email: "string",
  otp: "string",
  "user?": v.createRef(type("'User'")),
}],
}).export();

const types_update = scope({
  user: [v.document.update, "&", {
  "firstName?": "string",
  "lastName?": "string",
  "primaryEmail?": "string",
  "emails?": "string[]",
  "avatar?": "string",
  "accounts?": v.createRef(type("'Account'")).array(),
}],
  account: [v.document.update, "&", {
  "user?": v.createRef(type("'User'")),
  "socialProvider?": { "name?": "'Github' | 'Google' | 'Facebook'", "userId?": "string", "email?": "string" },
  "passkey?": { "publicKey?": "string", "algorithmId?": "number", "id?": "string" },
}],
  verification: [v.document.update, "&", {
  "email?": "string",
  "otp?": "string",
  "user?": v.createRef(type("'User'")),
}],
}).export();

const types_replace = scope({
  user: [v.document.replace, "&", {
  firstName: "string",
  lastName: "string",
  primaryEmail: "string",
  emails: "string[]",
  "avatar?": "string",
  accounts: v.createRef(type("'Account'")).array(),
}],
  account: [v.document.replace, "&", {
  user: v.createRef(type("'User'")),
  "socialProvider?": { name: "'Github' | 'Google' | 'Facebook'", userId: "string", email: "string" },
  "passkey?": { publicKey: "string", algorithmId: "number", id: "string" },
}],
  verification: [v.document.replace, "&", {
  email: "string",
  otp: "string",
  "user?": v.createRef(type("'User'")),
}],
}).export();


type User = typeof types.user.infer;
type User_Create = typeof types_create.user.infer;
type User_Update = typeof types_update.user.infer;
type User_Replace = typeof types_replace.user.infer;

type Account = typeof types.account.infer;
type Account_Create = typeof types_create.account.infer;
type Account_Update = typeof types_update.account.infer;
type Account_Replace = typeof types_replace.account.infer;

type Verification = typeof types.verification.infer;
type Verification_Create = typeof types_create.verification.infer;
type Verification_Update = typeof types_update.verification.infer;
type Verification_Replace = typeof types_replace.verification.infer;

interface UserCollectionsTypeMapping {
  Account: {
    main: Account;
    create: Account_Create;
    replace: Account_Replace;
    update: Account_Update;
  };
  User: {
    main: User;
    create: User_Create;
    replace: User_Replace;
    update: User_Update;
  };
  Verification: {
    main: Verification;
    create: Verification_Create;
    replace: Verification_Replace;
    update: Verification_Update;
  };
}

const validator = {
  user: {
    read: types.user,
    create: types_create.user,
    update: types_update.user,
    replace: types_replace.user,
  },
  account: {
    read: types.account,
    create: types_create.account,
    update: types_update.account,
    replace: types_replace.account,
  },
  verification: {
    read: types.verification,
    create: types_create.verification,
    update: types_update.verification,
    replace: types_replace.verification,
  }
};

export type {
  validator,
  validator as v,
  Account, Account_Create, Account_Replace, Account_Update,
  User, User_Create, User_Replace, User_Update,
  Verification, Verification_Create, Verification_Replace, Verification_Update,
  UserCollectionsTypeMapping,
};
