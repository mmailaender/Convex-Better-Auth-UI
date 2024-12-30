import { Module, TimeStub, type QueryValueObject } from 'fauna';

type Document<T extends QueryValueObject> = {
	id: string;
	coll: Module;
	ts: TimeStub;
	ttl?: TimeStub;
} & T;
type Document_Create<T extends QueryValueObject> = Partial<Omit<Document<T>, 'ts' | 'coll'>>;
type Document_Update<T extends QueryValueObject> = Omit<Document_Create<T>, 'id'>;
type Document_Replace<T extends QueryValueObject> = Document_Update<T>;

type NamedDocument<
	T extends QueryValueObject,
	T_Metadata extends QueryValueObject = Record<string, never>
> = {
	coll: Module;
	name: string;
	ts: TimeStub;
} & T & {
		data?: T_Metadata;
	};

type NamedDocument_Create<
	T extends QueryValueObject,
	T_Metadata extends QueryValueObject = Record<string, never>
> = {
	name: string;
} & T & {
		data?: T_Metadata;
	};

type NamedDocument_Update<
	T extends QueryValueObject,
	T_Metadata extends QueryValueObject = Record<string, never>
> = {
	name?: string;
} & T & {
		data?: T_Metadata;
	};

type NamedDocument_Replace<
	T extends QueryValueObject,
	T_Metadata extends QueryValueObject = Record<string, never>
> = NamedDocument_Update<T, T_Metadata>;

type Collection = {
	history_days: number;
	ttl_days?: number;
	document_ttls?: boolean;

	fields?: Fields;
	computed_fields?: ComputedFields;
	wildcard?: string;
	constraints: any[];
	indexes: any;

	migrations?: any;
};

type Collection_Create = Partial<Collection>;
type Collection_Update = Partial<Collection>;
type Collection_Replace = Partial<Collection>;

/**
 * Reusable FQL code stored as Fauna Functions.
 */
type Function = {
	/**
	 * FQL expression.
	 */
	body: string;
	/**
	 * Role to use when the function is called. Only included if role is provided when the UDF is created.
	 * Can be a built-in role, `admin`, `server`, or `server-readonly`, or a user-defined role that grants write privilege for Functions.
	 */
	role?: string;
};

type Function_Create = Partial<Function>;
type Function_Update = Partial<Function>;
type Function_Replace = Partial<Function>;

/**
 * Defines a {@link https://docs.fauna.com/fauna/current/learn/security/roles/#user-defined-role | user-defined role}. A role determines an authentication secret’s privileges, which control data access.
 *
 * Fauna stores user-defined roles as documents in the `Role` system collection. See {@link https://docs.fauna.com/fauna/current/reference/fql-api/auth/role/ | Role}.
 */
type Role = {
	/**
	 * Assigns the role to tokens based on the {@link https://docs.fauna.com/fauna/current/learn/security/tokens/ | token’s} identity document. See for more information on {@link https://fauna.com/docs/reference/javascript#membership-roles | Membership definition}.
	 */
	membership?: string;
	/**
	 * Allows one or more actions on a resource. See {@link https://docs.fauna.com/fauna/current/reference/fsl/role/#privileges-definition | Privileges definition}.
	 */
	privileges?: string;
};

type Role_Create = Partial<Role>;
type Role_Update = Partial<Role>;
type Role_Replace = Partial<Role>;

/**
 * Defines an {@link https://docs.fauna.com/fauna/current/learn/security/access-providers/ | access provider}.
 *
 * An access provider registers an external identity provider (IdP), such as Auth0, in your Fauna database.
 *
 * Once {@link https://docs.fauna.com/fauna/current/learn/security/access-providers/#config | set up}, the IdP can issue JSON Web Tokens (JWTs) that act as Fauna {@link https://docs.fauna.com/fauna/current/learn/security/authentication/#secrets | authentication secrets}. This lets your application’s end users use the IdP for authentication.
 */
type AccessProvider = {
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
	roles?: Array<string | AccessProviderRoleObject>;
	/**
	 * URI that points to public JSON web key sets (JWKS) for JWTs issued by the IdP. Fauna uses the keys to verify each JWT’s signature..
	 */
	jwks_uri: string;
	/**
	 * Globally unique URL for the Fauna database. audience URLs have the following structure:
	 *
	 * `https://db.fauna.com/db/<DATABASE_ID>` where `<DATABASE_ID>` is the {@link https://docs.fauna.com/fauna/current/learn/data-model/databases/#global-id | globally unique ID for the database}.
	 *
	 * Must match the `aud` claim in JWTs issued by the IdP.
	 */
	audience: string;
	/**
	 * Issuer for the IdP’s JWTs. Must match the `iss` claim in JWTs issued by the IdP.
	 */
	issuer: string;
};

type AccessProviderRoleObject = {
	role: string;
	predicate: string;
};

type AccessProvider_Create = Partial<AccessProvider>;
type AccessProvider_Update = Partial<AccessProvider>;
type AccessProvider_Replace = Partial<AccessProvider>;

type Functions<
	T extends QueryValueObject,
	T_Replace extends QueryValueObject,
	T_Update extends QueryValueObject
> = {
	update: (document: Document_Update<T_Update>) => void;
	replace: (document: Document_Replace<T_Replace>) => void;
	delete: () => void;
} & Document<T>;

type NamedFunctions<
	T extends QueryValueObject,
	T_Replace extends QueryValueObject,
	T_Update extends QueryValueObject
> = {
	update: (document: NamedDocument_Update<T_Update>) => void;
	replace: (document: NamedDocument_Update<T_Replace>) => void;
	delete: () => void;
} & NamedDocument<T>;


type Page<T extends QueryValueObject> = {
	data: T[];
	after?: string;
};

type Field = {
	signature: string;
};

type Fields = {
	[key: string]: Field;
};

type ComputedField = {
	body: string;
	signature: string;
};

type ComputedFields = {
	[key: string]: ComputedField;
};

const baseFields = {
	id: {
		signature: 'String'
	},
	coll: {
		signature: 'String'
	},
	ts: {
		signature: 'Timestamp'
	},
	ttl: {
		signature: 'Timestamp'
	}
};

type Predicate<T> = (item: T, index: number, array: T[]) => boolean;

interface SystemCollectionsTypeMapping {
	Collection: {
		main: Collection;
		create: Collection_Create;
		replace: Collection_Replace;
		update: Collection_Update;
	};
	Role: {
		main: Role;
		create: Role_Create;
		replace: Role_Replace;
		update: Role_Update;
	};
	AccessProvider: {
		main: AccessProvider;
		create: AccessProvider_Create;
		replace: AccessProvider_Replace;
		update: AccessProvider_Update;
	};
	Function: {
		main: Function;
		create: Function_Create;
		replace: Function_Replace;
		update: Function_Update;
	};
}

export {
	type NamedDocument,
	type NamedDocument_Create,
	type NamedDocument_Update,
	type NamedDocument_Replace,
	type Collection,
	type Collection_Create,
	type Collection_Update,
	type Collection_Replace,
	type Function,
	type Function_Create,
	type Function_Update,
	type Function_Replace,
	type Role,
	type Role_Create,
	type Role_Update,
	type Role_Replace,
	type AccessProvider,
	type AccessProvider_Create,
	type AccessProvider_Update,
	type AccessProvider_Replace,
	type Document,
	type Document_Create,
	type Document_Update,
	type Document_Replace,
	type Functions,
	type NamedFunctions,
	type Field,
	type Fields,
	type ComputedFields,
	baseFields,
	type Predicate,
	type Page,
	type SystemCollectionsTypeMapping
};
