<script lang="ts">
	import { setupConvexAuth } from '@mmailaender/convex-auth-svelte/sveltekit';
	import '../app.css';

	import { Toaster } from '$lib/primitives/ui/sonner';
	import Navbar from '$lib/Navbar.svelte';

	let { children, data } = $props();

	setupConvexAuth({ getServerState: () => data.authState });
</script>

<Toaster />
<div class="grid h-screen grid-rows-[auto_1fr]">
	<header><Navbar /></header>
	<main>
		{@render children()}
	</main>
</div>
