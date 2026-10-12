<script lang="ts">
	// SvelteKit
	import { resolve } from '$app/paths';
	// Icons
	import VenetianMaskIcon from '@lucide/svelte/icons/venetian-mask';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	// API
	import { useQuery } from 'convex-svelte';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { getAuthContext } from '#lib/auth/context.svelte.js';
	import { toast } from 'svelte-sonner';
	// Constants
	import { ADMIN_ROUTE } from '#lib/admin/utils/admin.constants.js';

	const { api, authClient } = getAuthContext();
	const auth = useAuth();

	const impersonationResponse = useQuery(api.admin.queries.getImpersonationStatus, () =>
		auth.isAuthenticated ? {} : 'skip'
	);
	const impersonation = $derived(impersonationResponse?.data);

	const activeUserResponse = useQuery(api.users.queries.getActiveUser, () =>
		auth.isAuthenticated ? {} : 'skip'
	);
	const activeUser = $derived(activeUserResponse?.data);

	let stopping = $state(false);

	async function handleStop() {
		stopping = true;
		const { error } = await authClient.admin.stopImpersonating();
		if (error) {
			stopping = false;
			toast.error(error.message ?? 'Failed to stop impersonating');
			return;
		}
		// Refresh the Convex JWT cookie the server renders with, then reload so every query
		// runs as the admin again
		await authClient.getSession();
		window.location.assign(resolve(ADMIN_ROUTE));
	}
</script>

<!--
	Banner shown while the current session is an admin impersonation
	(`session.impersonatedBy` is set). Renders nothing otherwise. Mounted once in
	the root layout (gated by `AUTH_CONSTANTS.admin`) so an impersonating admin
	always sees who they are acting as and can return to their own session.
-->
{#if impersonation}
	<div
		class="preset-filled-warning-500 sticky top-0 z-50 flex min-w-0 items-center justify-center gap-3 px-4 py-2 text-sm"
		role="status"
	>
		<VenetianMaskIcon class="size-4 shrink-0" aria-hidden="true" />
		<span class="truncate">
			You are impersonating <strong>{activeUser?.name ?? 'another user'}</strong>
		</span>
		<button
			type="button"
			class="btn btn-sm preset-outlined shrink-0"
			onclick={handleStop}
			disabled={stopping}
			aria-busy={stopping}
		>
			{#if stopping}
				<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
			{/if}
			Stop impersonating
		</button>
	</div>
{/if}
