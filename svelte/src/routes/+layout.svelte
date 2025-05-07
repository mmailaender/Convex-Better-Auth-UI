<script lang="ts">
	import { setupConvexAuth } from '@convex-dev/auth/sveltekit';
	import '../app.css';
	import Navbar from '$lib/Navbar.svelte';

	let { children, data } = $props();

	setupConvexAuth({ getServerState: () => data.authState });
</script>

<Navbar />
{@render children()}
