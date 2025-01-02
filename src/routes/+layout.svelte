<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { ParaglideJS } from '@inlang/paraglide-sveltekit';
	import '../app.css';
	import Navbar from '$lib/Navbar.svelte';
	let { children } = $props();
</script>

<ParaglideJS {i18n}>
	<Navbar />
	{@render children()}
</ParaglideJS>
