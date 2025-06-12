<script lang="ts">
	import { setupConvexAuth } from '@mmailaender/convex-auth-svelte/sveltekit';
	import '../app.css';

	import { Toaster } from '$lib/primitives/ui/sonner';
	import OrganizationSwitcher from '$lib/organizations/ui/OrganizationSwitcher.svelte';
	import UserButton from '$lib/users/ui/UserButton.svelte';

	let { children, data } = $props();

	setupConvexAuth({ getServerState: () => data.authState });
</script>

<Toaster position="top-center" />
<div class="grid h-screen grid-rows-[auto_1fr]">
	<header class="flex items-center justify-between gap-5 p-4">
		<div class="mr-auto text-2xl font-bold text-orange-500">Svelte</div>
		<OrganizationSwitcher />
		<UserButton />
	</header>
	<main>
		{@render children()}
	</main>
</div>
