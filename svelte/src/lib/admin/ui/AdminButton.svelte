<script lang="ts">
	// SvelteKit
	import { resolve } from '$app/paths';

	// Icons
	import ShieldIcon from '@lucide/svelte/icons/shield';

	// Constants & API
	import { getAuthContext } from '#lib/auth/context.svelte.js';
	import { useIsAppAdmin } from '#lib/admin/api/admin.svelte.js';
	import { ADMIN_ROUTE } from '#lib/admin/utils/admin.constants.js';

	let { class: className }: { class?: string } = $props();

	const { authConstants } = getAuthContext();
	const admin = useIsAppAdmin();
</script>

<!--
	Optional navigation link to the `/admin` dashboard. Renders nothing unless the
	`admin` feature is enabled and the current user is an application admin. Not
	mounted in the default layout — drop it into your own nav if you want a visible
	entry point. The admin dashboard is the `/admin` route.
-->
{#if authConstants.admin && admin.isAppAdmin}
	<a href={resolve(ADMIN_ROUTE)} class={className ?? 'btn preset-tonal gap-2'}>
		<ShieldIcon class="size-4" aria-hidden="true" />
		<span>Admin</span>
	</a>
{/if}
