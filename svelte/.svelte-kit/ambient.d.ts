
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```bash
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const BLOB_READ_WRITE_TOKEN: string;
	export const CONVEX_DEPLOYMENT: string;
	export const CONVEX_URL: string;
	export const CUSTOM_DOMAINS: string;
	export const EMAIL_SEND_FROM: string;
	export const FAUNA_SIGNIN_KEY: string;
	export const GITHUB_CLIENT_ID: string;
	export const GITHUB_CLIENT_SECRET: string;
	export const REOON_EMAIL_VERIFIER_TOKEN: string;
	export const RESEND_API_KEY: string;
	export const USER: string;
	export const SHLVL: string;
	export const HOME: string;
	export const OLDPWD: string;
	export const DBUS_SESSION_BUS_ADDRESS: string;
	export const WSL_DISTRO_NAME: string;
	export const WAYLAND_DISPLAY: string;
	export const LOGNAME: string;
	export const NAME: string;
	export const WSL_INTEROP: string;
	export const PULSE_SERVER: string;
	export const _: string;
	export const TERM: string;
	export const PATH: string;
	export const XDG_RUNTIME_DIR: string;
	export const DISPLAY: string;
	export const LANG: string;
	export const SHELL: string;
	export const PWD: string;
	export const WSL2_GUI_APPS_ENABLED: string;
	export const HOSTTYPE: string;
	export const WSLENV: string;
	export const VSCODE_CWD: string;
	export const VSCODE_NLS_CONFIG: string;
	export const VSCODE_HANDLES_SIGPIPE: string;
	export const FNM_ARCH: string;
	export const FNM_NODE_DIST_MIRROR: string;
	export const HOMEBREW_PREFIX: string;
	export const PNPM_HOME: string;
	export const FNM_COREPACK_ENABLED: string;
	export const LS_COLORS: string;
	export const INFOPATH: string;
	export const NVM_DIR: string;
	export const LESSCLOSE: string;
	export const LESSOPEN: string;
	export const HOMEBREW_CELLAR: string;
	export const NVM_CD_FLAGS: string;
	export const HOMEBREW_REPOSITORY: string;
	export const FNM_VERSION_FILE_STRATEGY: string;
	export const VERCEL_TOKEN: string;
	export const FNM_RESOLVE_ENGINES: string;
	export const XDG_DATA_DIRS: string;
	export const FNM_DIR: string;
	export const FNM_MULTISHELL_PATH: string;
	export const FNM_LOGLEVEL: string;
	export const VSCODE_ESM_ENTRYPOINT: string;
	export const VSCODE_HANDLES_UNCAUGHT_ERRORS: string;
	export const ELECTRON_RUN_AS_NODE: string;
	export const VSCODE_IPC_HOOK_CLI: string;
	export const VITEST_VSCODE_LOG: string;
	export const VITEST_VSCODE: string;
	export const TEST: string;
	export const VITEST_WS_ADDRESS: string;
	export const VITEST: string;
	export const NODE_ENV: string;
	export const PROD: string;
	export const DEV: string;
	export const BASE_URL: string;
	export const MODE: string;
}

/**
 * Similar to [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
	export const PUBLIC_APP_NAME: string;
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * This module cannot be imported into client-side code.
 * 
 * Dynamic environment variables cannot be used during prerendering.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		BLOB_READ_WRITE_TOKEN: string;
		CONVEX_DEPLOYMENT: string;
		CONVEX_URL: string;
		CUSTOM_DOMAINS: string;
		EMAIL_SEND_FROM: string;
		FAUNA_SIGNIN_KEY: string;
		GITHUB_CLIENT_ID: string;
		GITHUB_CLIENT_SECRET: string;
		REOON_EMAIL_VERIFIER_TOKEN: string;
		RESEND_API_KEY: string;
		USER: string;
		SHLVL: string;
		HOME: string;
		OLDPWD: string;
		DBUS_SESSION_BUS_ADDRESS: string;
		WSL_DISTRO_NAME: string;
		WAYLAND_DISPLAY: string;
		LOGNAME: string;
		NAME: string;
		WSL_INTEROP: string;
		PULSE_SERVER: string;
		_: string;
		TERM: string;
		PATH: string;
		XDG_RUNTIME_DIR: string;
		DISPLAY: string;
		LANG: string;
		SHELL: string;
		PWD: string;
		WSL2_GUI_APPS_ENABLED: string;
		HOSTTYPE: string;
		WSLENV: string;
		VSCODE_CWD: string;
		VSCODE_NLS_CONFIG: string;
		VSCODE_HANDLES_SIGPIPE: string;
		FNM_ARCH: string;
		FNM_NODE_DIST_MIRROR: string;
		HOMEBREW_PREFIX: string;
		PNPM_HOME: string;
		FNM_COREPACK_ENABLED: string;
		LS_COLORS: string;
		INFOPATH: string;
		NVM_DIR: string;
		LESSCLOSE: string;
		LESSOPEN: string;
		HOMEBREW_CELLAR: string;
		NVM_CD_FLAGS: string;
		HOMEBREW_REPOSITORY: string;
		FNM_VERSION_FILE_STRATEGY: string;
		VERCEL_TOKEN: string;
		FNM_RESOLVE_ENGINES: string;
		XDG_DATA_DIRS: string;
		FNM_DIR: string;
		FNM_MULTISHELL_PATH: string;
		FNM_LOGLEVEL: string;
		VSCODE_ESM_ENTRYPOINT: string;
		VSCODE_HANDLES_UNCAUGHT_ERRORS: string;
		ELECTRON_RUN_AS_NODE: string;
		VSCODE_IPC_HOOK_CLI: string;
		VITEST_VSCODE_LOG: string;
		VITEST_VSCODE: string;
		TEST: string;
		VITEST_WS_ADDRESS: string;
		VITEST: string;
		NODE_ENV: string;
		PROD: string;
		DEV: string;
		BASE_URL: string;
		MODE: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * Dynamic environment variables cannot be used during prerendering.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		PUBLIC_APP_NAME: string;
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
