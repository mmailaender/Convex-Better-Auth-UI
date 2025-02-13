import { type, scope } from "arktype";
import {
  DateStub,
  Document as FaunaDocument,
  DocumentReference,
  Module,
  NamedDocument as FaunaNamedDocument,
  NamedDocumentReference,
  NullDocument,
  TimeStub,
  Page,
  EmbeddedSet,
  StreamToken,
  type QueryValueObject
} from "fauna";

const dateStub = DateStub as type.cast<DateStub>;
const timeStub = TimeStub as type.cast<TimeStub>;
const module = type.instanceOf(Module);
const uint8Array = type("instanceof", Uint8Array);
const documentRef = type.instanceOf(DocumentReference);
const namedDocumentRef = type.instanceOf(NamedDocumentReference);
const nullDocument = type.instanceOf(NullDocument);
const page = type.instanceOf(Page);
const embeddedSet = type.instanceOf(EmbeddedSet);
const streamToken = type.instanceOf(StreamToken);
const field = type({
  signature: "string",
});
const fields = type({
  "[string]": field,
});
const document = type.instanceOf(FaunaDocument);
const namedDocument = type.instanceOf(FaunaNamedDocument);

const createDocumentRef = <T extends string>(ref: type.Any<T>) =>
  type({
	coll: ref,
	id: "string",
  });

const types = scope({
  queryValue: [
	"null | string | number | bigint | boolean | queryValueObject | queryValue[]",
	uint8Array,
	dateStub,
	timeStub,
	module,
	document,
	documentRef,
	namedDocument,
	namedDocumentRef,
	nullDocument,
	page,
	embeddedSet,
	streamToken,
  ],
  queryValueObject: {
	"[string]": "queryValue",
  },
  document: {
	id: "string",
	coll: module,
	ts: timeStub,
	"ttl?": timeStub,
  },
  document_create: {
	"id?": "string",
	"ttl?": timeStub,
  },
  document_update: {
	"ttl?": timeStub,
  },
  document_replace: {
	"ttl?": timeStub,
  },

  "namedDocument<metadata extends queryValueObject = Record<string, never>>": {
	coll: module,
	name: "string",
	ts: timeStub,
	"data?": "metadata",
  },
  "namedDocument_create<metadata extends queryValueObject = Record<string, never>>":
	{
	  "data?": "metadata",
	},
  "namedDocument_update<metadata extends queryValueObject = Record<string, never>>":
	{
	  "data?": "metadata",
	},
  "namedDocument_replace<metadata extends queryValueObject = Record<string, never>>":
	{
	  "data?": "metadata",
	},
}).export();

const collection = type(
  types.namedDocument("object", "object", "object"),
  "&",
  {
	history_days: "number",
	"ttl_days?": "number",
	"document_ttls?": "boolean",
	"fields?": fields,
	"computed_fields?": [
	  {
		body: "string",
		signature: "string",
	  },
	  "[]",
	],
	"wildcard?": "string",
	constraints: "unknown[]",
	indexes: "unknown",
	"migrations?": "unknown",
  }
);

const collection_create = type(
  types.namedDocument_create(types.queryValueObject, "object", "object"),
  "&",
  collection.omit("coll", "name", "ts", "data").partial()
);
const collection_update = type(
  types.namedDocument_update(types.queryValueObject, "object", "object"),
  "&",
  collection.omit("coll", "name", "ts", "data").partial()
);
const collection_replace = type(
  types.namedDocument_replace(types.queryValueObject, "object", "object"),
  "&",
  collection.omit("coll", "name", "ts", "data").partial()
);

/**
 * Reusable FQL code stored as Fauna Functions.
 */
const func = type(
  types.namedDocument(types.queryValueObject, "object", "object"),
  "&",
  {
	/**
	 * FQL expression.
	 */
	body: "string",
	/**
	 * Role to use when the function is called. Only included if role is provided when the UDF is created.
	 * Can be a built-in role, `admin`, `server`, or `server-readonly`, or a user-defined role that grants write privilege for Functions.
	 */
	"role?": "string",
  }
);
const func_create = type(
  types.namedDocument_create(types.queryValueObject, "object", "object"),
  "&",
  func.omit("coll", "name", "ts", "data").partial()
);
const func_update = type(
  types.namedDocument_update(types.queryValueObject, "object", "object"),
  "&",
  func.omit("coll", "name", "ts", "data").partial()
);
const func_replace = type(
  types.namedDocument_replace(types.queryValueObject, "object", "object"),
  "&",
  func.omit("coll", "name", "ts", "data").partial()
);

/**
 * Defines a {@link https://docs.fauna.com/fauna/current/learn/security/roles/#user-defined-role | user-defined role}. A role determines an authentication secret’s privileges, which control data access.
 *
 * Fauna stores user-defined roles as documents in the `Role` system collection. See {@link https://docs.fauna.com/fauna/current/reference/fql-api/auth/role/ | Role}.
 */
const role = type(
  types.namedDocument(types.queryValueObject, "object", "object"),
  "&",
  {
	/**
	 * Assigns the role to tokens based on the {@link https://docs.fauna.com/fauna/current/learn/security/tokens/ | token’s} identity document. See for more information on {@link https://fauna.com/docs/reference/javascript#membership-roles | Membership definition}.
	 */
	"membership?": "string",
	/**
	 * Allows one or more actions on a resource. See {@link https://docs.fauna.com/fauna/current/reference/fsl/role/#privileges-definition | Privileges definition}.
	 */
	"privileges?": "string",
  }
);

const role_create = type(
  types.namedDocument_create(types.queryValueObject, "object", "object"),
  "&",
  role.omit("coll", "name", "ts", "data").partial()
);
const role_update = type(
  types.namedDocument_update(types.queryValueObject, "object", "object"),
  "&",
  role.omit("coll", "name", "ts", "data").partial()
);
const role_replace = type(
  types.namedDocument_replace(types.queryValueObject, "object", "object"),
  "&",
  role.omit("coll", "name", "ts", "data").partial()
);

/**
 * Defines an {@link https://docs.fauna.com/fauna/current/learn/security/access-providers/ | access provider}.
 *
 * An access provider registers an external identity provider (IdP), such as Auth0, in your Fauna database.
 *
 * Once {@link https://docs.fauna.com/fauna/current/learn/security/access-providers/#config | set up}, the IdP can issue JSON Web Tokens (JWTs) that act as Fauna {@link https://docs.fauna.com/fauna/current/learn/security/authentication/#secrets | authentication secrets}. This lets your application’s end users use the IdP for authentication.
 */
const accessProvider = type(
  types.namedDocument(types.queryValueObject, "object", "object"),
  "&",
  {
	/**
	 * User-defined roles assigned to JWTs issued by the IdP. Can’t be built-in roles.
	 * @example
	 * ```ts
	 * roles: [
	 * 	"customer",
	 * 		{
	 * 			role: "manager",
	 * 			predicate: "(jwt) => jwt!.scope.includes(\"manager\")"
	 * 		}
	 * ]
	 * ```
	 */
	"roles?": [
	  "string[]",
	  "|",
	  {
		role: "string",
		predicate: "string",
	  },
	],
	/**
	 * URI that points to public JSON web key sets (JWKS) for JWTs issued by the IdP. Fauna uses the keys to verify each JWT’s signature..
	 */
	jwks_uri: "string",
	/**
	 * Globally unique URL for the Fauna database. audience URLs have the following structure:
	 *
	 * `https://db.fauna.com/db/<DATABASE_ID>` where `<DATABASE_ID>` is the {@link https://docs.fauna.com/fauna/current/learn/data-model/databases/#global-id | globally unique ID for the database}.
	 *
	 * Must match the `aud` claim in JWTs issued by the IdP.
	 */
	audience: "string",
	/**
	 * Issuer for the IdP’s JWTs. Must match the `iss` claim in JWTs issued by the IdP.
	 */
	issuer: "string",
  }
);

const accessProvider_create = type(
  types.namedDocument_create(types.queryValueObject, "object", "object"),
  "&",
  accessProvider.omit("coll", "name", "ts", "data").partial()
);
const accessProvider_update = type(
  types.namedDocument_update(types.queryValueObject, "object", "object"),
  "&",
  accessProvider.omit("coll", "name", "ts", "data").partial()
);
const accessProvider_replace = type(
  types.namedDocument_replace(types.queryValueObject, "object", "object"),
  "&",
  accessProvider.omit("coll", "name", "ts", "data").partial()
);

const validator = {
  document: {
	read: types.document,
	create: types.document_create,
	update: types.document_update,
	replace: types.document_replace,
  },
  namedDocument: {
	read: types.namedDocument,
	create: types.namedDocument_create,
	update: types.namedDocument_update,
	replace: types.namedDocument_replace,
  },
  function: {
	read: func,
	create: func_create,
	update: func_update,
	replace: func_replace,
  },
  collection: {
	read: collection,
	create: collection_create,
	update: collection_update,
	replace: collection_replace,
  },
  role: {
	read: role,
	create: role_create,
	update: role_update,
	replace: role_replace,
  },
  accessProvider: {
	read: accessProvider,
	create: accessProvider_create,
	update: accessProvider_update,
	replace: accessProvider_replace,
  },
  createRef: createDocumentRef,
  field,
  fields,
  nullDocument
};

export type DocumentT<T extends QueryValueObject> = {
	id: string;
	coll: Module;
	ts: TimeStub;
	ttl?: TimeStub;
} & T;
export type DocumentT_Create<T extends QueryValueObject> = Partial<Omit<DocumentT<T>, 'ts' | 'coll'>>;
export type DocumentT_Update<T extends QueryValueObject> = Omit<DocumentT_Create<T>, 'id'>;
export type DocumentT_Replace<T extends QueryValueObject> = DocumentT_Update<T>;

export type NamedDocumentT<
  T extends QueryValueObject,
  T_Metadata extends QueryValueObject = Record<string, never>
> = {
  coll: Module;
  name: string;
  ts: TimeStub;
  data?: T_Metadata;
} & T;

export type NamedDocumentT_Create<
  T extends QueryValueObject,
  T_Metadata extends QueryValueObject = Record<string, never>
> = {
  name: string;
  data?: T_Metadata;
} & T;
export type NamedDocumentT_Update<
  T extends QueryValueObject,
  T_Metadata extends QueryValueObject = Record<string, never>
> = {
  name?: string;
  data?: T_Metadata;
} & T;
export type NamedDocumentT_Replace<
  T extends QueryValueObject,
  T_Metadata extends QueryValueObject = Record<string, never>
> = NamedDocumentT_Update<T, T_Metadata>;

export type Function = typeof validator.function.read.infer;
export type Function_Create = typeof validator.function.create.infer;
export type Function_Update = typeof validator.function.update.infer;
export type Function_Replace = typeof validator.function.replace.infer;
export type Collection = typeof validator.collection.read.infer;
export type Collection_Create = typeof validator.collection.create.infer;
export type Collection_Update = typeof validator.collection.update.infer;
export type Collection_Replace = typeof validator.collection.replace.infer;
export type Role = typeof validator.role.read.infer;
export type Role_Create = typeof validator.role.create.infer;
export type Role_Update = typeof validator.role.update.infer;
export type Role_Replace = typeof validator.role.replace.infer;
export type AccessProvider = typeof validator.accessProvider.read.infer;
export type AccessProvider_Create = typeof validator.accessProvider.create.infer;
export type AccessProvider_Update = typeof validator.accessProvider.update.infer;
export type AccessProvider_Replace = typeof validator.accessProvider.replace.infer;
export type Field = typeof validator.field.infer;
export type Fields = typeof validator.fields.infer;

export {
  validator,
  validator as v,
  DateStub,
  Module,
  NullDocument,
  TimeStub,
  Page,
  EmbeddedSet,
  StreamToken,
};
