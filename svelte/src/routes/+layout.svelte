<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { ParaglideJS } from '@inlang/paraglide-sveltekit';
	import { setupConvexAuth } from '@convex-dev/auth/sveltekit';
	import '../app.css';
	import Navbar from '$lib/Navbar.svelte';

	let { children, data } = $props();

	setupConvexAuth({ getServerState: () => data.authState });
</script>

<ParaglideJS {i18n}>
	<Navbar />
	{@render children()}
</ParaglideJS>
