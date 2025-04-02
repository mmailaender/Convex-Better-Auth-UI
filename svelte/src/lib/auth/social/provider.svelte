<script>
	import { onMount } from 'svelte';
	import { Github, Google, Facebook, Apple } from './icons';
	let searchParams = '';

	onMount(() => {
		const url = new URL(window.location.href);
		searchParams = url.search;
	});
</script>

<div id="auth_social-login" class="flex flex-col gap-3">
	<a
		class="btn flex items-center gap-2 preset-filled-surface-100-900"
		href={`/api/auth/oauth/github${searchParams}`}
	>
		<Github class="size-5 dark:fill-white" />
		Continue with GitHub
	</a>
</div>
