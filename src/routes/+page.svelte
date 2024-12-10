<script lang="ts">
	import type { User } from '$lib/auth/sign-in/user';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let user: User = data.user ? JSON.parse(data.user) : null;
</script>

<div class="flex flex-col min-h-screen items-center justify-center gap-6">
	{#if user}
		Hello {user.email}
	{:else}
		Secret things ahead!
        <a class="btn preset-filled-primary-500" href="/sign-in">Sign in</a>
	{/if}
</div>
