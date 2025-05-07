
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
	export const CONVEX_DEPLOYMENT: string;
	export const LESSOPEN: string;
	export const npm_package_devDependencies__eslint_compat: string;
	export const npm_package_devDependencies__types_node: string;
	export const npm_package_scripts_init_repo: string;
	export const npm_package_devDependencies__sveltejs_adapter_vercel: string;
	export const npm_package_devDependencies_vitest: string;
	export const USER: string;
	export const npm_package_scripts_dev_backend: string;
	export const npm_package_dependencies__pilcrowjs_object_parser: string;
	export const npm_config_user_agent: string;
	export const npm_package_scripts_vercel_link: string;
	export const GIT_ASKPASS: string;
	export const VERCEL_TOKEN: string;
	export const npm_package_devDependencies__sveltejs_vite_plugin_svelte: string;
	export const npm_package_devDependencies_vite: string;
	export const npm_package_dependencies__tailwindcss_vite: string;
	export const npm_node_execpath: string;
	export const SHLVL: string;
	export const npm_package_dependencies_convex_ents: string;
	export const HOME: string;
	export const OLDPWD: string;
	export const npm_package_dependencies_arktype: string;
	export const npm_package_dependencies_convex_helpers: string;
	export const TERM_PROGRAM_VERSION: string;
	export const VSCODE_IPC_HOOK_CLI: string;
	export const npm_package_devDependencies_eslint_config_prettier: string;
	export const npm_package_devDependencies_eslint_plugin_svelte: string;
	export const npm_config_auto_install_peers: string;
	export const HOMEBREW_PREFIX: string;
	export const VSCODE_GIT_ASKPASS_MAIN: string;
	export const npm_package_devDependencies_svelte_check: string;
	export const FNM_ARCH: string;
	export const VSCODE_GIT_ASKPASS_NODE: string;
	export const npm_package_scripts_check: string;
	export const npm_package_devDependencies__tailwindcss_postcss: string;
	export const DBUS_SESSION_BUS_ADDRESS: string;
	export const npm_config_engine_strict: string;
	export const COLORTERM: string;
	export const WSL_DISTRO_NAME: string;
	export const npm_package_devDependencies__skeletonlabs_skeleton_svelte: string;
	export const npm_package_devDependencies__tailwindcss_forms: string;
	export const npm_package_devDependencies_tailwindcss: string;
	export const npm_package_devDependencies_typescript: string;
	export const NVM_DIR: string;
	export const npm_package_devDependencies_vite_plugin_mkcert: string;
	export const npm_package_dependencies__inlang_paraglide_sveltekit: string;
	export const WAYLAND_DISPLAY: string;
	export const INFOPATH: string;
	export const FNM_VERSION_FILE_STRATEGY: string;
	export const FNM_LOGLEVEL: string;
	export const npm_package_scripts_dev: string;
	export const npm_package_devDependencies_prettier: string;
	export const npm_package_dependencies__auth_core: string;
	export const npm_package_dependencies_convex: string;
	export const npm_package_dependencies_sharp: string;
	export const FORCE_COLOR: string;
	export const LOGNAME: string;
	export const npm_package_type: string;
	export const FNM_NODE_DIST_MIRROR: string;
	export const NAME: string;
	export const WSL_INTEROP: string;
	export const PULSE_SERVER: string;
	export const _: string;
	export const npm_package_scripts_check_watch: string;
	export const npm_package_dependencies__vercel_blob: string;
	export const npm_package_scripts_lint: string;
	export const npm_config_registry: string;
	export const TERM: string;
	export const npm_package_scripts_vercel_pull: string;
	export const npm_package_devDependencies_prettier_plugin_tailwindcss: string;
	export const npm_package_dependencies__oslojs_webauthn: string;
	export const npm_config_node_gyp: string;
	export const PATH: string;
	export const HOMEBREW_CELLAR: string;
	export const NODE: string;
	export const npm_package_name: string;
	export const npm_package_devDependencies_typescript_eslint: string;
	export const XDG_RUNTIME_DIR: string;
	export const npm_package_dependencies_jose: string;
	export const npm_config_frozen_lockfile: string;
	export const DISPLAY: string;
	export const npm_package_scripts_test_unit: string;
	export const LANG: string;
	export const npm_package_devDependencies_eslint: string;
	export const npm_package_dependencies_arctic: string;
	export const LS_COLORS: string;
	export const VSCODE_GIT_IPC_HANDLE: string;
	export const FNM_DIR: string;
	export const TERM_PROGRAM: string;
	export const npm_lifecycle_script: string;
	export const FNM_RESOLVE_ENGINES: string;
	export const npm_package_scripts_test: string;
	export const npm_package_devDependencies__sveltejs_kit: string;
	export const npm_package_devDependencies__tailwindcss_typography: string;
	export const npm_package_devDependencies_concurrently: string;
	export const npm_package_dependencies__oslojs_crypto: string;
	export const SHELL: string;
	export const NODE_PATH: string;
	export const npm_package_version: string;
	export const npm_package_devDependencies__zag_js_file_upload: string;
	export const npm_package_dependencies_convex_svelte: string;
	export const npm_lifecycle_event: string;
	export const npm_package_scripts_build: string;
	export const npm_package_devDependencies_svelte: string;
	export const LESSCLOSE: string;
	export const npm_package_devDependencies_globals: string;
	export const VSCODE_GIT_ASKPASS_EXTRA_ARGS: string;
	export const npm_package_scripts_format: string;
	export const PWD: string;
	export const FNM_MULTISHELL_PATH: string;
	export const npm_execpath: string;
	export const NVM_CD_FLAGS: string;
	export const XDG_DATA_DIRS: string;
	export const npm_package_dependencies_fauna: string;
	export const HOMEBREW_REPOSITORY: string;
	export const PNPM_SCRIPT_SRC_DIR: string;
	export const npm_package_devDependencies__sveltejs_adapter_auto: string;
	export const npm_package_devDependencies_cross_env: string;
	export const npm_package_dependencies__maizzle_framework: string;
	export const npm_package_dependencies_resend: string;
	export const npm_command: string;
	export const FNM_COREPACK_ENABLED: string;
	export const npm_package_scripts_preview: string;
	export const npm_package_scripts_pull_convex: string;
	export const npm_package_devDependencies_prettier_plugin_svelte: string;
	export const npm_package_dependencies__oslojs_encoding: string;
	export const WSL2_GUI_APPS_ENABLED: string;
	export const PNPM_HOME: string;
	export const HOSTTYPE: string;
	export const npm_package_scripts_dev_frontend: string;
	export const npm_package_dependencies__oslojs_binary: string;
	export const npm_package_dependencies_lucide_svelte: string;
	export const WSLENV: string;
	export const INIT_CWD: string;
	export const npm_package_devDependencies__skeletonlabs_skeleton: string;
	export const npm_package_dependencies__convex_dev_auth: string;
	export const NODE_ENV: string;
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
	export const PUBLIC_CONVEX_URL: string;
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
		CONVEX_DEPLOYMENT: string;
		LESSOPEN: string;
		npm_package_devDependencies__eslint_compat: string;
		npm_package_devDependencies__types_node: string;
		npm_package_scripts_init_repo: string;
		npm_package_devDependencies__sveltejs_adapter_vercel: string;
		npm_package_devDependencies_vitest: string;
		USER: string;
		npm_package_scripts_dev_backend: string;
		npm_package_dependencies__pilcrowjs_object_parser: string;
		npm_config_user_agent: string;
		npm_package_scripts_vercel_link: string;
		GIT_ASKPASS: string;
		VERCEL_TOKEN: string;
		npm_package_devDependencies__sveltejs_vite_plugin_svelte: string;
		npm_package_devDependencies_vite: string;
		npm_package_dependencies__tailwindcss_vite: string;
		npm_node_execpath: string;
		SHLVL: string;
		npm_package_dependencies_convex_ents: string;
		HOME: string;
		OLDPWD: string;
		npm_package_dependencies_arktype: string;
		npm_package_dependencies_convex_helpers: string;
		TERM_PROGRAM_VERSION: string;
		VSCODE_IPC_HOOK_CLI: string;
		npm_package_devDependencies_eslint_config_prettier: string;
		npm_package_devDependencies_eslint_plugin_svelte: string;
		npm_config_auto_install_peers: string;
		HOMEBREW_PREFIX: string;
		VSCODE_GIT_ASKPASS_MAIN: string;
		npm_package_devDependencies_svelte_check: string;
		FNM_ARCH: string;
		VSCODE_GIT_ASKPASS_NODE: string;
		npm_package_scripts_check: string;
		npm_package_devDependencies__tailwindcss_postcss: string;
		DBUS_SESSION_BUS_ADDRESS: string;
		npm_config_engine_strict: string;
		COLORTERM: string;
		WSL_DISTRO_NAME: string;
		npm_package_devDependencies__skeletonlabs_skeleton_svelte: string;
		npm_package_devDependencies__tailwindcss_forms: string;
		npm_package_devDependencies_tailwindcss: string;
		npm_package_devDependencies_typescript: string;
		NVM_DIR: string;
		npm_package_devDependencies_vite_plugin_mkcert: string;
		npm_package_dependencies__inlang_paraglide_sveltekit: string;
		WAYLAND_DISPLAY: string;
		INFOPATH: string;
		FNM_VERSION_FILE_STRATEGY: string;
		FNM_LOGLEVEL: string;
		npm_package_scripts_dev: string;
		npm_package_devDependencies_prettier: string;
		npm_package_dependencies__auth_core: string;
		npm_package_dependencies_convex: string;
		npm_package_dependencies_sharp: string;
		FORCE_COLOR: string;
		LOGNAME: string;
		npm_package_type: string;
		FNM_NODE_DIST_MIRROR: string;
		NAME: string;
		WSL_INTEROP: string;
		PULSE_SERVER: string;
		_: string;
		npm_package_scripts_check_watch: string;
		npm_package_dependencies__vercel_blob: string;
		npm_package_scripts_lint: string;
		npm_config_registry: string;
		TERM: string;
		npm_package_scripts_vercel_pull: string;
		npm_package_devDependencies_prettier_plugin_tailwindcss: string;
		npm_package_dependencies__oslojs_webauthn: string;
		npm_config_node_gyp: string;
		PATH: string;
		HOMEBREW_CELLAR: string;
		NODE: string;
		npm_package_name: string;
		npm_package_devDependencies_typescript_eslint: string;
		XDG_RUNTIME_DIR: string;
		npm_package_dependencies_jose: string;
		npm_config_frozen_lockfile: string;
		DISPLAY: string;
		npm_package_scripts_test_unit: string;
		LANG: string;
		npm_package_devDependencies_eslint: string;
		npm_package_dependencies_arctic: string;
		LS_COLORS: string;
		VSCODE_GIT_IPC_HANDLE: string;
		FNM_DIR: string;
		TERM_PROGRAM: string;
		npm_lifecycle_script: string;
		FNM_RESOLVE_ENGINES: string;
		npm_package_scripts_test: string;
		npm_package_devDependencies__sveltejs_kit: string;
		npm_package_devDependencies__tailwindcss_typography: string;
		npm_package_devDependencies_concurrently: string;
		npm_package_dependencies__oslojs_crypto: string;
		SHELL: string;
		NODE_PATH: string;
		npm_package_version: string;
		npm_package_devDependencies__zag_js_file_upload: string;
		npm_package_dependencies_convex_svelte: string;
		npm_lifecycle_event: string;
		npm_package_scripts_build: string;
		npm_package_devDependencies_svelte: string;
		LESSCLOSE: string;
		npm_package_devDependencies_globals: string;
		VSCODE_GIT_ASKPASS_EXTRA_ARGS: string;
		npm_package_scripts_format: string;
		PWD: string;
		FNM_MULTISHELL_PATH: string;
		npm_execpath: string;
		NVM_CD_FLAGS: string;
		XDG_DATA_DIRS: string;
		npm_package_dependencies_fauna: string;
		HOMEBREW_REPOSITORY: string;
		PNPM_SCRIPT_SRC_DIR: string;
		npm_package_devDependencies__sveltejs_adapter_auto: string;
		npm_package_devDependencies_cross_env: string;
		npm_package_dependencies__maizzle_framework: string;
		npm_package_dependencies_resend: string;
		npm_command: string;
		FNM_COREPACK_ENABLED: string;
		npm_package_scripts_preview: string;
		npm_package_scripts_pull_convex: string;
		npm_package_devDependencies_prettier_plugin_svelte: string;
		npm_package_dependencies__oslojs_encoding: string;
		WSL2_GUI_APPS_ENABLED: string;
		PNPM_HOME: string;
		HOSTTYPE: string;
		npm_package_scripts_dev_frontend: string;
		npm_package_dependencies__oslojs_binary: string;
		npm_package_dependencies_lucide_svelte: string;
		WSLENV: string;
		INIT_CWD: string;
		npm_package_devDependencies__skeletonlabs_skeleton: string;
		npm_package_dependencies__convex_dev_auth: string;
		NODE_ENV: string;
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
		PUBLIC_CONVEX_URL: string;
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
