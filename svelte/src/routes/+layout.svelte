<script lang="ts">
	import { resolve } from '$app/paths';
	import './layout.css';
	import { createSvelteAuthClient } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { authClient } from '$lib/auth/api/auth-client';

	import { Toaster } from '$lib/primitives/ui/sonner';
	import OrganizationSwitcher from '$lib/organizations/ui/OrganizationSwitcher.svelte';
	import UserButton from '$lib/users/ui/UserButton.svelte';
	import AuthDialogProvider from '$lib/auth/ui/AuthDialogProvider.svelte';

	import { AUTH_CONSTANTS } from '$convex/auth.constants';

	let { children, data } = $props();

	createSvelteAuthClient({ authClient, getServerState: () => data.authState });
</script>

<Toaster position="top-center" />
<AuthDialogProvider initialData={data.initialData}>
	<div class="grid min-h-[100dvh] grid-rows-[auto_1fr] overflow-x-hidden">
		<header class="flex items-center justify-between gap-5 p-4">
			<a href={resolve('/')} class="mr-auto text-2xl font-bold text-orange-500">Svelte</a>
			{#if AUTH_CONSTANTS.organizations}
				<OrganizationSwitcher initialData={data.initialData} />
			{/if}
			<UserButton initialData={data.initialData} />
		</header>
		<main>
			{@render children()}
		</main>
	</div>
</AuthDialogProvider>
