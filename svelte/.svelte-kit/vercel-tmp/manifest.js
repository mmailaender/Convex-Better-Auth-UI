export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {"start":"_app/immutable/entry/start.BFUYSnd1.js","app":"_app/immutable/entry/app.F418Jzxu.js","imports":["_app/immutable/entry/start.BFUYSnd1.js","_app/immutable/chunks/entry.BCpqZHYJ.js","_app/immutable/entry/app.F418Jzxu.js","_app/immutable/chunks/i18n.BtnGCmBD.js","_app/immutable/chunks/disclose-version.w09OKvMr.js","_app/immutable/chunks/entry.BCpqZHYJ.js","_app/immutable/chunks/stores.CbtBh4Gh.js","_app/immutable/chunks/props.CeX9gEMn.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
		nodes: [
			__memo(() => import('../output/server/nodes/0.js')),
			__memo(() => import('../output/server/nodes/1.js')),
			__memo(() => import('../output/server/nodes/2.js')),
			__memo(() => import('../output/server/nodes/3.js')),
			__memo(() => import('../output/server/nodes/4.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/api/auth/emails/verification",
				pattern: /^\/api\/auth\/emails\/verification\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/auth/emails/verification/_server.ts.js'))
			},
			{
				id: "/api/auth/oauth/github",
				pattern: /^\/api\/auth\/oauth\/github\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/auth/oauth/github/_server.ts.js'))
			},
			{
				id: "/api/auth/oauth/github/callback",
				pattern: /^\/api\/auth\/oauth\/github\/callback\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/auth/oauth/github/callback/_server.ts.js'))
			},
			{
				id: "/api/auth/sign-out",
				pattern: /^\/api\/auth\/sign-out\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/auth/sign-out/_server.ts.js'))
			},
			{
				id: "/api/auth/webauthn/challenge",
				pattern: /^\/api\/auth\/webauthn\/challenge\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/auth/webauthn/challenge/_server.ts.js'))
			},
			{
				id: "/api/auth/webauthn/passkey/sign-in",
				pattern: /^\/api\/auth\/webauthn\/passkey\/sign-in\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/auth/webauthn/passkey/sign-in/_server.ts.js'))
			},
			{
				id: "/api/auth/webauthn/passkey/sign-up",
				pattern: /^\/api\/auth\/webauthn\/passkey\/sign-up\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/auth/webauthn/passkey/sign-up/_server.ts.js'))
			},
			{
				id: "/api/auth/webauthn/verify-email",
				pattern: /^\/api\/auth\/webauthn\/verify-email\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/auth/webauthn/verify-email/_server.ts.js'))
			},
			{
				id: "/sign-in",
				pattern: /^\/sign-in\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/user-profile",
				pattern: /^\/user-profile\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			}
		],
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
