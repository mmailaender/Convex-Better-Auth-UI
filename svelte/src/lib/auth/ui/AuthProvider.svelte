<script lang="ts">
	// Context
	import { setAuthContext } from '#lib/auth/context.svelte.js';

	// Types
	import type { AuthContext } from '#lib/auth/types.js';

	type AuthProviderProps = AuthContext & {
		/** Child content to render */
		children?: import('svelte').Snippet;
	};

	let { api, authClient, authConstants, children }: AuthProviderProps = $props();

	// Inject context for all descendant components (static config — never changes per request)
	// svelte-ignore state_referenced_locally
	const ctx: AuthContext = { api, authClient, authConstants };
	setAuthContext(ctx);
</script>

{#if children}
	{@render children()}
{/if}
